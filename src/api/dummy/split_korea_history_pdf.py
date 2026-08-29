"""
한국사능력검정시험 문제지 PDF를 문제별 이미지로 분할하는 스크립트
- PDF 내 각 페이지를 고해상도 이미지(DPI 200)로 렌더링
- Gemini Vision API를 활용하여 각 문제의 영역(문제 번호, 발문, 사료/지문, 보기, 선지 전체) 자동 감지
- 다중 GEMINI_API_KEY 자동 로드 및 429/할당량 초과 시 자동 순환(Rotation) 지원
- 추출된 각 문제를 PDF 파일명과 동일한 하위 폴더(예: 79회_심화/)에 {문제번호}.png 파일로 저장
"""

import os
import sys
import json
import time
import re
import argparse
import logging
from typing import List, Dict, Any, Tuple, Optional
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
from google.genai.errors import APIError

# ==========================================
# 1. 로거 설정
# ==========================================
logger = logging.getLogger("KoreaHistorySplitter")
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
    
    # 1) 환경 변수 먼저 확인
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
# 3. GeminiKeyManager (다중 키 자동 교체)
# ==========================================
class GeminiKeyManager:
    """Gemini API 키를 관리하며 에러(429/Quota 등) 발생 시 다음 키로 자동 전환"""

    def __init__(self, key_entries: List[Tuple[str, str]]):
        if not key_entries:
            raise ValueError("등록된 Gemini API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.")
        self.key_entries = key_entries
        self.current_idx = 0
        self.consecutive_failed_keys = 0
        self.client = genai.Client(api_key=self.current_key)

    @property
    def current_key(self) -> str:
        return self.key_entries[self.current_idx][1]

    @property
    def current_key_label(self) -> str:
        return self.key_entries[self.current_idx][0]

    def record_success(self):
        self.consecutive_failed_keys = 0

    def switch_to_next_key(self, reason: str = ""):
        self.consecutive_failed_keys += 1
        old_label = self.current_key_label

        if self.consecutive_failed_keys >= len(self.key_entries):
            logger.warning(f"⚠️ 모든 API 키({len(self.key_entries)}개)가 1회 순회되었습니다. 15초 대기 후 다시 시도합니다...")
            time.sleep(15)
            self.consecutive_failed_keys = 0

        self.current_idx = (self.current_idx + 1) % len(self.key_entries)
        new_label = self.current_key_label
        logger.info(f"🔄 [API 키 전환] {old_label} ({reason}) ➔ {new_label} ({self.current_idx + 1}/{len(self.key_entries)})")
        self.client = genai.Client(api_key=self.current_key)


# ==========================================
# 4. 문제 영역 감지 프롬프트 및 파싱 함수
# ==========================================
DETECTION_PROMPT = """이 이미지는 대한민국 한국사능력검정시험(심화/기본) 문제지의 한 페이지입니다.
시험지는 일반적으로 2단(좌측 열, 우측 열)으로 구성되어 있습니다.

이 페이지에 포함된 모든 문제의 번호(1~50 사이 정수)와 각 문제의 영역을 나타내는 Bounding Box(0~1000 정규화 좌표 [ymin, xmin, ymax, xmax])를 정확히 찾아주세요.

[필수 요구사항]
1. 각 문제 영역은 다음을 모두 온전히 포함해야 합니다:
   - 좌측 상단 문제 번호 (예: 1., 24.)
   - 우측 상단 배점 표시 (예: [1점], [2점], [3점]) ➔ 우측 끝이 잘리지 않도록 xmax를 넉넉하게 잡으세요.
   - 문제 발문 및 지문, 사료, 그림/사진 박스, 보기 (<보기>)
   - 하단 5지선다 선지 (①, ②, ③, ④, ⑤) 전체 ➔ ⑤번 선지 하단 텍스트가 잘리지 않도록 ymax를 넉넉하게 잡으세요.
2. 상단 시험지 제목/수험번호 영역이나 하단 페이지 번호는 문제에 포함되지 않아야 합니다.
3. 좌측 열과 우측 열의 중앙 구분선을 넘지 않도록 각 열에 맞게 xmin, xmax를 설정하세요.

반환 형식 (반드시 아래 JSON 형식만 반환):
[
  {
    "question_number": 1,
    "box_2d": [ymin, xmin, ymax, xmax]
  }
]
"""


def detect_questions_on_page(
    key_manager: GeminiKeyManager,
    page_img: Image.Image,
    page_num: int,
    model_name: str = "gemini-3.6-flash",
    max_retries: int = 15
) -> List[Dict[str, Any]]:
    """Gemini API를 호출하여 한 페이지 내의 문제 번호 및 Bounding Box 추출"""
    
    for attempt in range(max_retries):
        try:
            response = key_manager.client.models.generate_content(
                model=model_name,
                contents=[page_img, DETECTION_PROMPT],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            raw_text = response.text.strip()
            
            # JSON 파싱
            # 혹시 마크다운 블록이 포함되어 있을 경우 정제
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
                raw_text = re.sub(r"\n```$", "", raw_text)
            
            data = json.loads(raw_text)
            if isinstance(data, list):
                # 유효한 문제 데이터 필터링 및 정렬
                valid_items = []
                for item in data:
                    if "question_number" in item and "box_2d" in item:
                        q_num = int(item["question_number"])
                        box = item["box_2d"]
                        if len(box) == 4:
                            valid_items.append({"question_number": q_num, "box_2d": box})
                
                # 문제 번호 오름차순 정렬
                valid_items.sort(key=lambda x: x["question_number"])
                key_manager.record_success()
                return valid_items
            else:
                logger.warning(f"⚠️ [Page {page_num}] 예상치 못한 응답 포맷: {raw_text[:100]}")
                time.sleep(1)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                key_manager.switch_to_next_key(reason="할당량 초과(429)")
            else:
                logger.warning(f"⚠️ [Page {page_num}] API 호출 에러: {err_str}")
                key_manager.switch_to_next_key(reason="호출 실패")
            time.sleep(2)

    logger.error(f"❌ [Page {page_num}] {max_retries}회 재시도 후에도 문제 감지 실패")
    return []


# ==========================================
# 5. 이미지 크롭 및 패딩 보정
# ==========================================
def crop_question_image(
    page_img: Image.Image,
    box_2d: List[float],
    padding_x: int = 8,
    padding_y: int = 8
) -> Image.Image:
    """정규화된 0~1000 박스 좌표를 원본 픽셀 크기에 맞게 크롭하며 안전 패딩 적용"""
    width, height = page_img.size
    ymin, xmin, ymax, xmax = box_2d

    # 픽셀 좌표 변환
    px_xmin = int(xmin / 1000.0 * width)
    px_ymin = int(ymin / 1000.0 * height)
    px_xmax = int(xmax / 1000.0 * width)
    px_ymax = int(ymax / 1000.0 * height)

    # 열 위치 판별 (좌측 열 vs 우측 열)
    is_left_col = (xmin + xmax) / 2.0 < 500.0
    mid_x = int(width * 0.50)

    # 패딩 적용
    px_ymin = max(0, px_ymin - padding_y)
    px_ymax = min(height, px_ymax + padding_y)

    if is_left_col:
        px_xmin = max(0, px_xmin - padding_x)
        # 좌측 열은 중앙 분리선을 넘지 않도록 제한
        px_xmax = min(mid_x - 5, px_xmax + padding_x)
    else:
        # 우측 열은 중앙 분리선 오른쪽부터 시작
        px_xmin = max(mid_x + 5, px_xmin - padding_x)
        px_xmax = min(width, px_xmax + padding_x)

    # 유효한 바운딩 박스 검증
    if px_xmax <= px_xmin or px_ymax <= px_ymin:
        # 최소 크기 fallback
        px_xmin = max(0, int(xmin / 1000.0 * width))
        px_ymin = max(0, int(ymin / 1000.0 * height))
        px_xmax = min(width, int(xmax / 1000.0 * width))
        px_ymax = min(height, int(ymax / 1000.0 * height))

    return page_img.crop((px_xmin, px_ymin, px_xmax, px_ymax))


# ==========================================
# 6. PDF 파일 분할 처리 메인 파이프라인
# ==========================================
def process_pdf(
    pdf_path: str,
    output_base_dir: str,
    key_manager: GeminiKeyManager,
    dpi: int = 200,
    img_format: str = "png"
) -> Dict[str, Any]:
    """단일 PDF 파일을 처리하여 각 문제 이미지를 폴더에 저장"""
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_dir = os.path.join(output_base_dir, pdf_name)
    os.makedirs(output_dir, exist_ok=True)

    logger.info("=" * 60)
    logger.info(f"📄 PDF 처리 시작: {os.path.basename(pdf_path)}")
    logger.info(f"📁 저장 폴더: {output_dir}")
    logger.info("=" * 60)

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    logger.info(f"총 {total_pages}개 페이지 렌더링 및 분석 시작 (DPI: {dpi})")

    extracted_questions = {}
    manifest = {
        "pdf_file": os.path.basename(pdf_path),
        "total_pages": total_pages,
        "dpi": dpi,
        "questions": []
    }

    for page_idx in range(total_pages):
        page_num = page_idx + 1
        page = doc[page_idx]
        
        # 고해상도 렌더링
        pix = page.get_pixmap(dpi=dpi)
        page_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        logger.info(f"\n[Page {page_num}/{total_pages}] Gemini로 문제 영역 감지 중... (이미지 크기: {pix.width}x{pix.height})")
        detected = detect_questions_on_page(key_manager, page_img, page_num)

        if not detected:
            logger.warning(f"  ⚠️ [Page {page_num}] 감지된 문제가 없습니다.")
            continue

        q_nums = [item["question_number"] for item in detected]
        logger.info(f"  ✅ [Page {page_num}] 감지된 문제: {q_nums}")

        for item in detected:
            q_num = item["question_number"]
            box_2d = item["box_2d"]
            
            # 크롭 및 저장
            cropped_img = crop_question_image(page_img, box_2d)
            filename = f"{q_num}.{img_format.lower()}"
            save_path = os.path.join(output_dir, filename)
            
            if img_format.lower() in ["jpg", "jpeg"]:
                cropped_img.convert("RGB").save(save_path, "JPEG", quality=95)
            else:
                cropped_img.save(save_path, "PNG")

            extracted_questions[q_num] = save_path
            manifest["questions"].append({
                "question_number": q_num,
                "page": page_num,
                "box_2d": box_2d,
                "filename": filename,
                "image_width": cropped_img.width,
                "image_height": cropped_img.height
            })
            logger.info(f"    ➔ 문제 {q_num}번 저장 완료: {filename} ({cropped_img.width}x{cropped_img.height})")

        # API 레이트 리밋 방지를 위한 짧은 딜레이
        time.sleep(1.0)

    # Manifest 메타데이터 저장
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    logger.info("=" * 60)
    logger.info(f"🎉 [{pdf_name}] 분할 완료! 총 {len(extracted_questions)}개 문제 이미지 생성됨")
    logger.info(f"📋 메타데이터 저장됨: {manifest_path}")
    logger.info("=" * 60)

    return manifest


# ==========================================
# 7. 메인 실행 진입점
# ==========================================
def main():
    parser = argparse.ArgumentParser(description="한국사능력검정시험 PDF 문제별 이미지 분할기")
    parser.add_argument(
        "--dir",
        type=str,
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "korea-history"),
        help="PDF 파일들이 위치한 디렉토리 경로 (기본값: src/api/dummy/korea-history)"
    )
    parser.add_argument(
        "--pdf",
        type=str,
        default=None,
        help="특정 PDF 파일만 처리할 경우 지정하는 파일 경로"
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
    args = parser.parse_args()

    # 1. API 키 로드
    api_keys = load_all_api_keys()
    if not api_keys:
        logger.error("❌ GEMINI_API_KEY를 찾을 수 없습니다. 프로젝트 루트의 .env 파일을 확인해주세요.")
        sys.exit(1)

    key_labels = [label for label, _ in api_keys]
    logger.info(f"🔑 총 {len(api_keys)}개의 Gemini API 키 로드됨 ({', '.join(key_labels)})")
    key_manager = GeminiKeyManager(api_keys)

    # 2. 대상 PDF 목록 구성
    target_pdfs = []
    if args.pdf:
        if os.path.exists(args.pdf):
            target_pdfs.append(args.pdf)
        else:
            logger.error(f"❌ 지정한 PDF 파일이 존재하지 않습니다: {args.pdf}")
            sys.exit(1)
    else:
        target_dir = os.path.abspath(args.dir)
        if not os.path.exists(target_dir):
            logger.error(f"❌ 대상 디렉토리가 존재하지 않습니다: {target_dir}")
            sys.exit(1)

        for fname in sorted(os.listdir(target_dir)):
            if fname.lower().endswith(".pdf"):
                target_pdfs.append(os.path.join(target_dir, fname))

    if not target_pdfs:
        logger.warning(f"⚠️ 처리할 PDF 파일이 없습니다: {args.dir}")
        sys.exit(0)

    logger.info(f"🎯 처리할 PDF 파일 목록 ({len(target_pdfs)}개):")
    for p in target_pdfs:
        logger.info(f"  - {os.path.basename(p)}")

    # 3. 각 PDF 순차 처리
    for pdf_path in target_pdfs:
        output_dir = os.path.dirname(pdf_path)
        process_pdf(
            pdf_path=pdf_path,
            output_base_dir=output_dir,
            key_manager=key_manager,
            dpi=args.dpi,
            img_format=args.format
        )


if __name__ == "__main__":
    main()
