"""
공인중개사 자격시험 문제지 PDF를 문제별 3종 이미지로 자동 분할하는 스크립트
- PDF 내 각 페이지를 고해상도 이미지(DPI 200)로 렌더링
- Gemini Vision API를 활용하여 각 문제의 3중 영역 자동 감지:
    1) full_image: 문제 전체 (문제 번호, 발문, 박스/지문/도표, 선지 ①~⑤)
    2) question: 문제 발문 및 지문/보기/도표 (선지 직전까지)
    3) choices: 객관식 선지 영역 (선지 ①~⑤)
- 다중 API 키(10개) 및 다중 모델(gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.6-flash) 자동 순환 지원
- 완결성 보장(Completeness Guarantee): 누락된 문제가 있을 경우 해당 페이지를 집중 재탐색하여 100% 추출
- 출력 파일 네이밍:
    - {번호:02d}_full_image.png
    - {번호:02d}_question.png
    - {번호:02d}_choices.png
- 각 PDF 파일명(예: 2020_31_1_1_question.pdf)에 맞춰 하위 폴더(예: 2020_31_1_1/)에 저장
"""

import os
import sys
import json
import time
import re
import argparse
import logging
from typing import List, Dict, Any, Tuple, Optional, Set
from PIL import Image

# Windows 콘솔 UTF-8 한글 깨짐 방지
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        print("❌ pymupdf 라이브러리가 필요합니다. pip install pymupdf")
        sys.exit(1)

from google import genai
from google.genai import types

# ==========================================
# 1. 로거 설정
# ==========================================
logger = logging.getLogger("RealEstateSplitter")
logger.setLevel(logging.INFO)
logger.handlers.clear()

stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(logging.INFO)
stream_formatter = logging.Formatter("[%(asctime)s] %(message)s", datefmt="%H:%M:%S")
stream_handler.setFormatter(stream_formatter)
logger.addHandler(stream_handler)


# ==========================================
# 2. .env 탐색 및 API 키 로드
# ==========================================
def load_all_api_keys() -> List[Tuple[str, str]]:
    """프로젝트 루트 및 상위 경로의 .env 파일에서 모든 GEMINI_API_KEY 로드"""
    key_dict: Dict[int, Tuple[str, str]] = {}

    # 1) 환경 변수 확인
    for k, v in os.environ.items():
        match = re.match(r"^GEMINI_API_KEY_(\d+)$", k)
        if match and v and v.strip():
            key_dict[int(match.group(1))] = (k, v.strip())
        elif k == "GEMINI_API_KEY" and v and v.strip():
            key_dict[999] = (k, v.strip())

    # 2) .env 파일 직접 탐색
    current_dir = os.path.dirname(os.path.abspath(__file__))
    for _ in range(6):
        env_path = os.path.join(current_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k_clean = k.strip()
                        v_clean = v.strip().strip("'\"")
                        match = re.match(r"^GEMINI_API_KEY_(\d+)$", k_clean)
                        if match and v_clean:
                            key_dict[int(match.group(1))] = (k_clean, v_clean)
                        elif k_clean == "GEMINI_API_KEY" and v_clean:
                            if 999 not in key_dict:
                                key_dict[999] = (k_clean, v_clean)
            break
        current_dir = os.path.dirname(current_dir)

    if not key_dict:
        return []

    return [key_dict[num] for num in sorted(key_dict.keys())]


# ==========================================
# 3. GeminiKeyManager (다중 키 & 다중 모델 자동 교체)
# ==========================================
AVAILABLE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
]


class GeminiKeyManager:
    """Gemini API 키 및 모델을 관리하며 에러(429/Quota 등) 발생 시 다음 키/모델로 자동 전환"""

    def __init__(self, key_entries: List[Tuple[str, str]], models: Optional[List[str]] = None):
        if not key_entries:
            raise ValueError("등록된 Gemini API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.")
        self.key_entries = key_entries
        self.models = models or AVAILABLE_MODELS
        self.current_key_idx = 0
        self.current_model_idx = 0
        self.consecutive_failed_keys = 0
        self.client = genai.Client(api_key=self.current_key)

    @property
    def current_key(self) -> str:
        return self.key_entries[self.current_key_idx][1]

    @property
    def current_key_label(self) -> str:
        return self.key_entries[self.current_key_idx][0]

    @property
    def current_model(self) -> str:
        return self.models[self.current_model_idx]

    def record_success(self):
        self.consecutive_failed_keys = 0

    def switch_to_next(self, reason: str = ""):
        self.consecutive_failed_keys += 1
        old_label = self.current_key_label
        old_model = self.current_model

        # 503/UNAVAILABLE 등 서버 과부하인 경우 즉시 모델 전환
        if "503" in reason or "UNAVAILABLE" in reason or "demand" in reason.lower():
            self.current_model_idx = (self.current_model_idx + 1) % len(self.models)
            logger.info(f"🔀 [서버 과부하 즉시 모델 전환] {old_model} ➔ {self.current_model}")
        else:
            # 다음 키로 전환
            self.current_key_idx = (self.current_key_idx + 1) % len(self.key_entries)
            # 1바퀴 돌았으면 다음 모델로 전환
            if self.current_key_idx == 0:
                self.current_model_idx = (self.current_model_idx + 1) % len(self.models)
                logger.info(f"🔀 [키 1회 순회 완료 -> 모델 전환] {old_model} ➔ {self.current_model}")

        # 모든 키와 모델이 1회 순회되었을 때 슬라이딩 윈도우(15초) 대기
        if self.consecutive_failed_keys >= len(self.key_entries) * len(self.models):
            logger.warning(f"⚠️ 모든 API 키({len(self.key_entries)}개) 및 모델({len(self.models)}개)이 1회 순회되었습니다. 15초 대기 후 재개...")
            time.sleep(15)
            self.consecutive_failed_keys = 0

        new_label = self.current_key_label
        self.client = genai.Client(api_key=self.current_key)
        logger.info(f"🔄 [전환] {old_label} ({reason}) ➔ {new_label} | 모델: {self.current_model}")


# ==========================================
# 4. 문제 영역 감지 프롬프트 및 파싱 함수
# ==========================================
DETECTION_PROMPT = """이 이미지는 대한민국 공인중개사 자격시험 문제지의 한 페이지입니다.
시험지는 일반적으로 2단(좌측 열, 우측 열)으로 구성되어 있습니다.

이 페이지에 포함된 모든 문제의 번호(1~80 사이 정수)와 각 문제에 대해 다음 3가지 영역의 Bounding Box(0~1000 정규화 좌표 [ymin, xmin, ymax, xmax])를 정확히 찾아주세요:

1. `full_box`: 문제 전체 영역 (문제 번호, 발문, 지문/보기 박스, 그림/표, 5지선다 선지 ①~⑤ 전체 포함)
2. `question_box`: 문제 발문 및 지문/보기 박스/그림 영역 (문제 번호부터 선지 시작 직전까지)
3. `choices_box`: 5지선다 객관식 선지 영역 (선지 ①번부터 ⑤번 끝까지)

[필수 요구사항]
1. 텍스트나 박스 테두리가 잘리지 않도록 상하좌우 경계를 충분히 여유 있게 감싸주세요.
2. `question_box`는 좌측 상단 문제 번호 및 발문부터 지문/표/박스 끝까지 포함해야 합니다.
3. `choices_box`는 ①번 선지부터 ⑤번 선지 끝까지 포함해야 합니다.
4. `full_box`는 `question_box`와 `choices_box`를 모두 포함하는 전체 영역이어야 합니다.
5. 상단 시험지 헤더(과목명, 수험번호 등)나 하단 페이지 번호/시험 정보는 문제에 포함되지 않아야 합니다.
6. 좌측 열과 우측 열의 중앙 구분선을 넘지 않도록 각 열의 가로 영역에 맞게 xmin, xmax를 설정하세요.

반환 형식 (반드시 유효한 JSON 배열만 반환):
[
  {
    "question_number": 1,
    "full_box": [ymin, xmin, ymax, xmax],
    "question_box": [ymin, xmin, ymax, xmax],
    "choices_box": [ymin, xmin, ymax, xmax]
  }
]
"""

TARGETED_PROMPT_TEMPLATE = """이 이미지는 대한민국 공인중개사 자격시험 문제지의 한 페이지입니다.
이 페이지에서 특히 다음 문제 번호 {target_q_nums}를 포함하여 페이지에 있는 문제들의 번호와 3가지 영역 Bounding Box(0~1000 정규화 좌표 [ymin, xmin, ymax, xmax])를 정확히 찾아주세요:

1. `full_box`: 문제 전체 영역 (문제 번호, 발문, 지문/보기 박스, 5지선다 선지 ①~⑤ 전체)
2. `question_box`: 발문 및 지문/보기 영역 (선지 시작 직전까지)
3. `choices_box`: 선지 ①~⑤ 영역

반환 형식 (반드시 유효한 JSON 배열만 반환):
[
  {{
    "question_number": 1,
    "full_box": [ymin, xmin, ymax, xmax],
    "question_box": [ymin, xmin, ymax, xmax],
    "choices_box": [ymin, xmin, ymax, xmax]
  }}
]
"""


def detect_questions_on_page(
    key_manager: GeminiKeyManager,
    page_img: Image.Image,
    page_num: int,
    target_q_nums: Optional[List[int]] = None,
    max_retries: int = 40
) -> List[Dict[str, Any]]:
    """Gemini API를 호출하여 한 페이지 내의 문제 번호 및 3가지 Bounding Box 추출 (성공할 때까지 자동 키/모델 전환)"""

    prompt = (
        TARGETED_PROMPT_TEMPLATE.format(target_q_nums=target_q_nums)
        if target_q_nums
        else DETECTION_PROMPT
    )

    for attempt in range(max_retries):
        try:
            model_to_use = key_manager.current_model
            response = key_manager.client.models.generate_content(
                model=model_to_use,
                contents=[page_img, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            raw_text = response.text.strip() if response.text else ""

            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
                raw_text = re.sub(r"\n```$", "", raw_text)

            data = json.loads(raw_text)
            if isinstance(data, list):
                valid_items = []
                for item in data:
                    if "question_number" in item and "full_box" in item:
                        try:
                            q_num = int(item["question_number"])
                        except (ValueError, TypeError):
                            continue
                        full_box = item["full_box"]
                        q_box = item.get("question_box", full_box)
                        c_box = item.get("choices_box", full_box)

                        if len(full_box) == 4 and len(q_box) == 4 and len(c_box) == 4:
                            valid_items.append({
                                "question_number": q_num,
                                "full_box": [float(v) for v in full_box],
                                "question_box": [float(v) for v in q_box],
                                "choices_box": [float(v) for v in c_box]
                            })

                if len(valid_items) > 0:
                    valid_items.sort(key=lambda x: x["question_number"])
                    key_manager.record_success()
                    return valid_items
                else:
                    logger.warning(f"⚠️ [Page {page_num}] 문제 영역 미검출(0개), 다음 키/모델로 재시도...")
                    key_manager.switch_to_next(reason="0개 검출")
                    time.sleep(1)
            else:
                logger.warning(f"⚠️ [Page {page_num}] 비배열 JSON 응답, 재시도...")
                key_manager.switch_to_next(reason="비배열 응답")
                time.sleep(1)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                key_manager.switch_to_next(reason="할당량 초과(429)")
            else:
                logger.warning(f"⚠️ [Page {page_num}] API 에러: {err_str[:120]}")
                key_manager.switch_to_next(reason="호출 에러")
            time.sleep(1.5)

    logger.error(f"❌ [Page {page_num}] {max_retries}회 재시도 후에도 문제 감지 실패")
    return []


# ==========================================
# 5. 이미지 크롭 및 패딩 보정
# ==========================================
def crop_box(
    page_img: Image.Image,
    box: List[float],
    col_xmin: Optional[int] = None,
    col_xmax: Optional[int] = None,
    pad_x: int = 8,
    pad_y: int = 6
) -> Image.Image:
    """정규화된 0~1000 박스 좌표를 원본 픽셀 크기에 맞게 크롭"""
    width, height = page_img.size
    raw_ymin, raw_xmin, raw_ymax, raw_xmax = box
    ymin, ymax = min(raw_ymin, raw_ymax), max(raw_ymin, raw_ymax)
    xmin, xmax = min(raw_xmin, raw_xmax), max(raw_xmin, raw_xmax)
    mid_x = int(width * 0.50)

    px_ymin = int(ymin / 1000.0 * height)
    px_ymax = int(ymax / 1000.0 * height)

    if col_xmin is not None and col_xmax is not None:
        px_xmin = min(col_xmin, col_xmax)
        px_xmax = max(col_xmin, col_xmax)
    else:
        px_xmin = int(xmin / 1000.0 * width)
        px_xmax = int(xmax / 1000.0 * width)

    is_left_col = ((xmin + xmax) / 2.0 < 500.0) if col_xmin is None else (px_xmax <= mid_x)

    # 패딩 적용
    px_ymin = max(0, px_ymin - pad_y)
    px_ymax = min(height, px_ymax + pad_y)

    if is_left_col:
        px_xmin = max(0, px_xmin - pad_x)
        px_xmax = min(mid_x - 4, px_xmax + pad_x)
    else:
        px_xmin = max(mid_x + 4, px_xmin - pad_x)
        px_xmax = min(width, px_xmax + pad_x)

    # 최소 크기 및 좌표 역전 안전 보정
    if px_xmax <= px_xmin:
        if is_left_col:
            px_xmin = 0
            px_xmax = mid_x - 4
        else:
            px_xmin = mid_x + 4
            px_xmax = width

    if px_ymax <= px_ymin:
        px_ymax = min(height, px_ymin + 50)
        if px_ymax <= px_ymin:
            px_ymin = max(0, px_ymax - 50)

    return page_img.crop((px_xmin, px_ymin, px_xmax, px_ymax))


def get_column_bounds(full_box: List[float], width: int) -> Tuple[int, int]:
    """좌/우 2단 컬럼 여백을 고려한 좌우 픽셀 범위 계산"""
    _, xmin, _, xmax = full_box
    is_left_col = (xmin + xmax) / 2.0 < 500.0
    mid_x = int(width * 0.50)

    px_xmin = int(xmin / 1000.0 * width)
    px_xmax = int(xmax / 1000.0 * width)

    if is_left_col:
        col_xmin = max(0, px_xmin)
        col_xmax = min(mid_x - 5, px_xmax)
    else:
        col_xmin = max(mid_x + 5, px_xmin)
        col_xmax = min(width, px_xmax)

    return col_xmin, col_xmax


def save_question_images(
    page_img: Image.Image,
    q_item: Dict[str, Any],
    output_dir: str,
    page_num: int,
    ext: str = "png"
) -> Dict[str, Any]:
    """검출된 문제의 full, question, choices 3종 이미지를 디스크에 저장하고 레코드 반환"""
    q_num = q_item["question_number"]
    full_box = q_item["full_box"]
    q_box = q_item["question_box"]
    c_box = q_item["choices_box"]

    col_xmin, col_xmax = get_column_bounds(full_box, page_img.width)

    full_img = crop_box(page_img, full_box, col_xmin, col_xmax, pad_x=8, pad_y=8)
    question_img = crop_box(page_img, q_box, col_xmin, col_xmax, pad_x=8, pad_y=6)
    choices_img = crop_box(page_img, c_box, col_xmin, col_xmax, pad_x=8, pad_y=6)

    full_filename = f"{q_num:02d}_full_image.{ext}"
    question_filename = f"{q_num:02d}_question.{ext}"
    choices_filename = f"{q_num:02d}_choices.{ext}"

    full_save_path = os.path.join(output_dir, full_filename)
    question_save_path = os.path.join(output_dir, question_filename)
    choices_save_path = os.path.join(output_dir, choices_filename)

    if ext in ["jpg", "jpeg"]:
        full_img.convert("RGB").save(full_save_path, "JPEG", quality=95)
        question_img.convert("RGB").save(question_save_path, "JPEG", quality=95)
        choices_img.convert("RGB").save(choices_save_path, "JPEG", quality=95)
    else:
        full_img.save(full_save_path, "PNG")
        question_img.save(question_save_path, "PNG")
        choices_img.save(choices_save_path, "PNG")

    return {
        "question_number": q_num,
        "page": page_num,
        "full_box": full_box,
        "question_box": q_box,
        "choices_box": c_box,
        "full_image": full_filename,
        "question_image": question_filename,
        "choices_image": choices_filename,
        "full_size": [full_img.width, full_img.height],
        "question_size": [question_img.width, question_img.height],
        "choices_size": [choices_img.width, choices_img.height]
    }


# ==========================================
# 6. PDF 파일 분할 처리 메인 파이프라인
# ==========================================
def get_expected_question_count(pdf_filename: str) -> int:
    """PDF 파일명 기반 예상 문제 수 반환 (1_1 및 2_1은 80문제, 2_2는 40문제)"""
    if "_2_2_" in pdf_filename or "_2_2." in pdf_filename:
        return 40
    return 80


def check_is_complete(output_dir: str, expected_q_count: int, ext: str = "png") -> Tuple[bool, Dict[int, Dict[str, Any]]]:
    """디스크 상의 3종 이미지 파일과 manifest를 검사하여 100% 완전한지 확인"""
    manifest_path = os.path.join(output_dir, "manifest.json")
    extracted_questions: Dict[int, Dict[str, Any]] = {}

    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            for q in manifest_data.get("questions", []):
                q_num = q.get("question_number")
                if q_num and 1 <= q_num <= expected_q_count:
                    f_p = os.path.join(output_dir, q.get("full_image", f"{q_num:02d}_full_image.{ext}"))
                    q_p = os.path.join(output_dir, q.get("question_image", f"{q_num:02d}_question.{ext}"))
                    c_p = os.path.join(output_dir, q.get("choices_image", f"{q_num:02d}_choices.{ext}"))
                    if os.path.exists(f_p) and os.path.exists(q_p) and os.path.exists(c_p):
                        extracted_questions[q_num] = q
        except Exception:
            extracted_questions = {}

    # manifest가 없더라도 디스크에 이미지 파일들이 있는 경우 로드
    for q_num in range(1, expected_q_count + 1):
        if q_num not in extracted_questions:
            f_p = os.path.join(output_dir, f"{q_num:02d}_full_image.{ext}")
            q_p = os.path.join(output_dir, f"{q_num:02d}_question.{ext}")
            c_p = os.path.join(output_dir, f"{q_num:02d}_choices.{ext}")
            if os.path.exists(f_p) and os.path.exists(q_p) and os.path.exists(c_p):
                extracted_questions[q_num] = {
                    "question_number": q_num,
                    "page": 0,
                    "full_image": f"{q_num:02d}_full_image.{ext}",
                    "question_image": f"{q_num:02d}_question.{ext}",
                    "choices_image": f"{q_num:02d}_choices.{ext}"
                }

    is_complete = len(extracted_questions) == expected_q_count
    return is_complete, extracted_questions


def process_pdf(
    pdf_path: str,
    key_manager: GeminiKeyManager,
    dpi: int = 200,
    img_format: str = "png",
    force: bool = False
) -> Optional[Dict[str, Any]]:
    """단일 PDF 파일을 처리하여 각 문제의 3종 이미지를 폴더에 저장 (100% 완결성 보장)"""
    pdf_base = os.path.basename(pdf_path)
    parent_dir = os.path.dirname(pdf_path)

    folder_name = pdf_base
    if folder_name.lower().endswith(".pdf"):
        folder_name = folder_name[:-4]
    if folder_name.lower().endswith("_question"):
        folder_name = folder_name[:-9]
    output_dir = os.path.join(parent_dir, folder_name)

    expected_q_count = get_expected_question_count(pdf_base)
    ext = img_format.lower()
    if ext not in ["png", "jpg", "jpeg"]:
        ext = "png"

    is_complete, extracted_questions = check_is_complete(output_dir, expected_q_count, ext)

    if is_complete and not force:
        logger.info(f"⏩ [SKIP] 이미 100% 완료됨: {folder_name} (총 {len(extracted_questions)}/{expected_q_count}문제 완벽 보유)")
        manifest_path = os.path.join(output_dir, "manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)

    os.makedirs(output_dir, exist_ok=True)

    logger.info("=" * 70)
    logger.info(f"📄 PDF 처리 시작: {pdf_base} (목표: {expected_q_count}문제, 현재 유효: {len(extracted_questions)}문제)")
    logger.info(f"📁 저장 폴더: {output_dir}")
    logger.info("=" * 70)

    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    # 1단계: 전체 페이지 순회 및 문제 추출
    for page_idx in range(total_pages):
        page_num = page_idx + 1
        page = doc[page_idx]

        pix = page.get_pixmap(dpi=dpi)
        page_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        logger.info(f"\n[Page {page_num}/{total_pages}] 문제 영역 분석 중...")
        detected = detect_questions_on_page(key_manager, page_img, page_num)

        if detected:
            q_nums = [item["question_number"] for item in detected]
            logger.info(f"  ✅ [Page {page_num}] 감지된 문제: {q_nums}")

            for item in detected:
                q_num = item["question_number"]
                if 1 <= q_num <= expected_q_count:
                    q_record = save_question_images(page_img, item, output_dir, page_num, ext)
                    extracted_questions[q_num] = q_record
                    logger.info(f"    ➔ Q{q_num:02d} 저장 완료 (Page {page_num})")
        else:
            logger.warning(f"  ⚠️ [Page {page_num}] 감지된 문제가 없습니다.")

        time.sleep(0.5)

    # 2단계: 누락 문제 집중 탐색 및 보정 루프 (Missing Questions Targeted Loop)
    max_recovery_rounds = 4
    for round_idx in range(1, max_recovery_rounds + 1):
        missing_nums = [n for n in range(1, expected_q_count + 1) if n not in extracted_questions]
        if not missing_nums:
            break

        logger.info(f"\n🔄 [누락 보정 라운드 {round_idx}/{max_recovery_rounds}] {len(missing_nums)}개 누락 감지: {missing_nums}")

        # 누락된 문제가 속할 가능성이 높은 페이지 식별
        pages_to_check: Set[int] = set()
        for m_q in missing_nums:
            # 이전/다음 번호의 페이지 확인
            prev_p = extracted_questions.get(m_q - 1, {}).get("page", 0)
            next_p = extracted_questions.get(m_q + 1, {}).get("page", 0)

            if prev_p > 0 and next_p > 0:
                for p in range(prev_p, next_p + 1):
                    if 1 <= p <= total_pages:
                        pages_to_check.add(p)
            elif prev_p > 0:
                pages_to_check.add(prev_p)
                if prev_p + 1 <= total_pages:
                    pages_to_check.add(prev_p + 1)
            elif next_p > 0:
                pages_to_check.add(next_p)
                if next_p - 1 >= 1:
                    pages_to_check.add(next_p - 1)
            else:
                # 예상 페이지 추정
                approx_page = max(1, min(total_pages, int((m_q / expected_q_count) * total_pages) + 1))
                pages_to_check.add(approx_page)
                if approx_page - 1 >= 1:
                    pages_to_check.add(approx_page - 1)
                if approx_page + 1 <= total_pages:
                    pages_to_check.add(approx_page + 1)

        # 누락 대상 페이지들 집중 재탐색
        for page_num in sorted(pages_to_check):
            page_idx = page_num - 1
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=dpi)
            page_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            logger.info(f"[보정 Page {page_num}/{total_pages}] 집중 재분석 중... (타겟: {missing_nums})")
            detected = detect_questions_on_page(key_manager, page_img, page_num, target_q_nums=missing_nums)

            for item in detected:
                q_num = item["question_number"]
                if 1 <= q_num <= expected_q_count:
                    q_record = save_question_images(page_img, item, output_dir, page_num, ext)
                    extracted_questions[q_num] = q_record
                    logger.info(f"    🎉 [누락 회복!] Q{q_num:02d} 저장 성공 (Page {page_num})")

            time.sleep(0.5)

    # 3단계: 최종 Manifest 작성 및 저장
    manifest_path = os.path.join(output_dir, "manifest.json")
    manifest = {
        "pdf_file": pdf_base,
        "folder": folder_name,
        "total_pages": total_pages,
        "expected_questions": expected_q_count,
        "dpi": dpi,
        "questions": []
    }
    sorted_q_nums = sorted(extracted_questions.keys())
    for q_num in sorted_q_nums:
        manifest["questions"].append(extracted_questions[q_num])

    manifest["total_extracted"] = len(manifest["questions"])
    missing_nums = [n for n in range(1, expected_q_count + 1) if n not in extracted_questions]
    manifest["missing_questions"] = missing_nums

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    logger.info("=" * 70)
    if missing_nums:
        logger.warning(f"⚠️ [{folder_name}] 최종 분할 완료되었으나 여전히 누락된 문제 있음 ({len(missing_nums)}개): {missing_nums}")
    else:
        logger.info(f"🎉 [{folder_name}] 전체 {len(sorted_q_nums)}/{expected_q_count}문제 분할 100% 완벽 성공!")
    logger.info(f"📋 Manifest 저장 완료: {manifest_path}")
    logger.info("=" * 70)

    return manifest


# ==========================================
# 7. 메인 실행 진입점
# ==========================================
def main():
    parser = argparse.ArgumentParser(description="공인중개사 시험 PDF 문제별 3종 이미지 분할기")
    parser.add_argument(
        "--dir",
        type=str,
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "real-estate"),
        help="PDF들이 위치한 기본 디렉토리 경로 (기본값: macro/real-estate)"
    )
    parser.add_argument(
        "--year",
        type=str,
        default=None,
        help="특정 연도/회차만 처리할 경우 (예: 2022_33)"
    )
    parser.add_argument(
        "--pdf",
        type=str,
        default=None,
        help="특정 단일 PDF 파일 경로"
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="PDF 페이지 렌더링 DPI (기본값: 200)"
    )
    parser.add_argument(
        "--format",
        type=str,
        default="png",
        choices=["png", "jpg", "jpeg"],
        help="저장할 이미지 포맷 (기본값: png)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="기존 완료된 파일이 있어도 강제 재실행"
    )
    args = parser.parse_args()

    # 1. API 키 로드
    api_keys = load_all_api_keys()
    if not api_keys:
        logger.error("❌ GEMINI_API_KEY를 찾을 수 없습니다. 프로젝트 루트의 .env 파일을 확인해주세요.")
        sys.exit(1)

    key_labels = [label for label, _ in api_keys]
    logger.info(f"🔑 총 {len(api_keys)}개의 Gemini API 키 로드됨 ({', '.join(key_labels)})")
    key_manager = GeminiKeyManager(api_keys)

    base_dir = os.path.abspath(args.dir)
    target_pdfs = []
    if args.pdf:
        if os.path.exists(args.pdf):
            target_pdfs.append(os.path.abspath(args.pdf))
        else:
            logger.error(f"❌ 지정한 PDF 파일이 존재하지 않습니다: {args.pdf}")
            sys.exit(1)
    else:
        if not os.path.exists(base_dir):
            logger.error(f"❌ 대상 디렉토리가 존재하지 않습니다: {base_dir}")
            sys.exit(1)

        if args.year:
            year_dir = os.path.join(base_dir, args.year)
            if os.path.exists(year_dir):
                for fname in sorted(os.listdir(year_dir)):
                    if fname.lower().endswith("_question.pdf"):
                        target_pdfs.append(os.path.join(year_dir, fname))
            else:
                logger.error(f"❌ 지정한 연도 디렉토리가 존재하지 않습니다: {year_dir}")
                sys.exit(1)
        else:
            for root, _, files in os.walk(base_dir):
                for fname in sorted(files):
                    if fname.lower().endswith("_question.pdf"):
                        target_pdfs.append(os.path.join(root, fname))

    if not target_pdfs:
        logger.warning("⚠️ 처리할 문제 PDF 파일이 없습니다.")
        sys.exit(0)

    target_pdfs.sort()
    logger.info(f"🎯 처리할 PDF 파일 목록 ({len(target_pdfs)}개):")
    for p in target_pdfs:
        logger.info(f"  - {os.path.relpath(p, base_dir)}")

    # 3. 각 PDF 순차 처리
    success_count = 0
    total_missing = 0

    for pdf_path in target_pdfs:
        res = process_pdf(
            pdf_path=pdf_path,
            key_manager=key_manager,
            dpi=args.dpi,
            img_format=args.format,
            force=args.force
        )
        if res:
            success_count += 1
            total_missing += len(res.get("missing_questions", []))

    logger.info("\n" + "=" * 70)
    logger.info(f"✨ [전체 완료 요약] 총 {len(target_pdfs)}개 PDF 중 {success_count}개 처리 완료 (누락 문제 합계: {total_missing}개)")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
