import os
import sys
import json
import time
import re
import logging
from typing import Optional, Dict, Any, List, Tuple

# Windows 콘솔 한글 깨짐 방지
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# .env 로드 (python-dotenv 사용 또는 fallback 파일 읽기)
try:
    from dotenv import load_dotenv

    # 프로젝트 루트 또는 상위 폴더의 .env 탐색 및 로드
    load_dotenv(override=False)
except ImportError:
    pass

# fallback: 직접 프로젝트 루트의 .env 파일 탐색
current_dir = os.path.dirname(os.path.abspath(__file__))
for _ in range(5):
    env_path = os.path.join(current_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k_clean = k.strip()
                    if k_clean.startswith("GEMINI_API_KEY"):
                        os.environ[k_clean] = v.strip().strip("'\"")
        break
    current_dir = os.path.dirname(current_dir)

from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, Field

# ==========================================
# 1. 경로 및 기본 설정
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "default.json")
RESULT_FILE = os.path.join(BASE_DIR, "default_result.json")
ORIGINAL_LOG_FILE = os.path.join(BASE_DIR, "log.txt")
LOG_FILE = os.path.join(BASE_DIR, "log_error.txt")

DEFAULT_DELAY_SECONDS = 10.0  # 호출 완료 후 기본 대기 시간 (10초)
MODEL_NAME = "gemini-3.6-flash"

# Logger 설정 (콘솔 + log_error.txt 동시 출력 및 즉시 플러시)
logger = logging.getLogger("GeminiWrongAnswerSolver")
logger.setLevel(logging.INFO)
logger.handlers.clear()

file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8", mode="a")
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter("[%(asctime)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_formatter)

stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(logging.INFO)
stream_formatter = logging.Formatter("%(message)s")
stream_handler.setFormatter(stream_formatter)

logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# ==========================================
# 2. Gemini API 키 배열 및 KeyManager 설정
# ==========================================
key_dict = {}
for k, v in os.environ.items():
    match = re.match(r"^GEMINI_API_KEY_(\d+)$", k)
    if match and v and v.strip():
        key_dict[int(match.group(1))] = (k, v.strip())

if key_dict:
    API_KEYS = [key_dict[num] for num in sorted(key_dict.keys())]
else:
    single_key = os.environ.get("GEMINI_API_KEY")
    if single_key and single_key.strip():
        API_KEYS = [("GEMINI_API_KEY", single_key.strip())]
    else:
        API_KEYS = []

if not API_KEYS:
    logger.error("❌ [오류] GEMINI_API_KEY 또는 GEMINI_API_KEY_1 등이 설정되지 않았습니다.")
    logger.error("   프로젝트 루트의 .env 파일에 GEMINI_API_KEY_1=..., GEMINI_API_KEY_2=... 를 추가해주세요.")
    sys.exit(1)


class AllKeysExhaustedError(Exception):
    """모든 Gemini API 키가 소진되었거나 연속 에러로 한 바퀴 모두 실패했을 때 발생하는 예외"""

    pass


class GeminiKeyManager:
    """
    GEMINI API 키들을 순차적으로 관리하며, 1회 에러/할당량 초과 발생 시 즉시 다음 키로 전환합니다.
    처음 로드된 모든 키가 한 바퀴 완전히 순회(소진)되었을 경우 AllKeysExhaustedError를 발생시키고 스크립트를 종료합니다.
    """

    def __init__(self, key_entries: list[tuple[str, str]], max_errors_per_key: int = 1):
        self.key_entries = key_entries
        self.max_errors = max_errors_per_key
        self.current_idx = 0
        self.consecutive_errors = 0
        self.consecutive_failed_keys = 0
        self.client = genai.Client(api_key=self.current_key)

    @property
    def current_key(self) -> str:
        return self.key_entries[self.current_idx][1]

    @property
    def current_key_label(self) -> str:
        return self.key_entries[self.current_idx][0]

    def record_success(self):
        """호출 성공 시 현재 키의 연속 에러 카운트 및 연속 실패 키 카운트 초기화"""
        self.consecutive_errors = 0
        self.consecutive_failed_keys = 0

    def record_error(self, err: Exception) -> bool:
        """에러 발생 시 카운트 증가. max_errors 이상이면 다음 키로 전환"""
        self.consecutive_errors += 1
        logger.warning(
            f"  ⚠️ [{self.current_key_label}] 에러 감지 ({self.consecutive_errors}/{self.max_errors}): {err}"
        )
        if self.consecutive_errors >= self.max_errors:
            self.switch_to_next_key()
            return True
        return False

    def switch_to_next_key(self):
        """다음 API 키로 전환 또는 모든 키 소진 시 AllKeysExhaustedError 발생"""
        self.consecutive_failed_keys += 1
        old_label = self.current_key_label

        if self.consecutive_failed_keys >= len(self.key_entries):
            logger.error("=" * 65)
            logger.error(
                f"🛑 [모든 키 순회 완료 / 소진] 등록된 총 {len(self.key_entries)}개의 API 키가 "
                f"한 바퀴({len(self.key_entries)}개 키)를 완전히 순회(할당량 초과/소진)했습니다."
            )
            logger.error(
                f"🛑 마지막 점검 키: {old_label} (순회 완료 키: {self.consecutive_failed_keys}/{len(self.key_entries)})"
            )
            logger.error("=" * 65)
            raise AllKeysExhaustedError(
                f"처음 로드된 모든 Gemini API 키({len(self.key_entries)}개)의 1바퀴 순회가 완료되어 스크립트를 종료합니다."
            )

        if len(self.key_entries) <= 1:
            logger.warning(
                f"  ⚠️ 사용 가능한 다른 API 키가 없습니다. 기존 키({self.current_key_label})를 유지합니다."
            )
            self.consecutive_errors = 0
            return

        self.current_idx = (self.current_idx + 1) % len(self.key_entries)
        self.consecutive_errors = 0
        new_label = self.current_key_label

        logger.warning(
            f"  🔄 [API 키 전환] {old_label} (에러/할당량 초과) -> "
            f"{new_label} (키 인덱스 {self.current_idx + 1}/{len(self.key_entries)}, "
            f"순회 완료: {self.consecutive_failed_keys}/{len(self.key_entries)})로 자동 전환합니다."
        )
        self.client = genai.Client(api_key=self.current_key)


key_manager = GeminiKeyManager(API_KEYS, max_errors_per_key=1)
key_names = ", ".join([label for label, _ in API_KEYS])
logger.info(
    f"🔑 총 {len(API_KEYS)}개의 Gemini API 키 로드 완료 ({key_names}). 현재 사용 중인 키: {key_manager.current_key_label}"
)


# ==========================================
# 3. 반환받을 출력 데이터 모델 정의
# ==========================================
class ProblemSolution(BaseModel):
    predicted_answer: int = Field(
        description="가장 타당한 정답 선택지 번호 (1, 2, 3, 4, 5 중 하나 정수)"
    )
    explanation: str = Field(
        description="문제의 종합 상세 해설 (정답 도출 이유, 관련 이론/조문, 풀이 과정 등)"
    )
    choice_explanations: list[str] = Field(
        description="선택지 번호(1번부터 순서대로)별로 왜 맞는지 또는 왜 틀렸는지에 대한 구체적인 해설 목록 (전달된 choices 개수와 동일)"
    )
    key_concept: str = Field(
        description="문제 풀이에 사용된 핵심 개념이나 관련 법령/이론 요약"
    )


# ==========================================
# 4. log.txt 및 log_error.txt 분석 함수
# ==========================================
def extract_mismatch_problem_identifiers(log_path: str) -> List[Tuple[int, str, int]]:
    """
    log.txt 파일을 읽어서 'MISMATCH' (불일치)로 기록된 문제들의 (global_idx, script_id, p_num) 리스트를 추출합니다.
    """
    if not os.path.exists(log_path):
        logger.warning(f"⚠️ {log_path} 파일이 존재하지 않습니다.")
        return []

    mismatches = []
    curr_prob = None

    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            # 문제 시작 패턴: [11/1400] Script: 1787100000001 | 문제 #11
            m = re.search(r"\[(\d+)/(\d+)\] Script:\s*(\S+)\s*\|\s*문제 #(\d+)", line)
            if m:
                curr_prob = {
                    "global_idx": int(m.group(1)),
                    "total": int(m.group(2)),
                    "script_id": m.group(3),
                    "p_num": int(m.group(4)),
                }

            # 불일치 로그 확인: 🤖 LLM 예측 정답: 5 -> ❌ MISMATCH
            if curr_prob and ("MISMATCH" in line or "불일치" in line or "❌" in line) and "LLM 예측 정답" in line:
                mismatches.append(
                    (curr_prob["global_idx"], curr_prob["script_id"], curr_prob["p_num"])
                )
                curr_prob = None

    return mismatches


def get_last_successful_problem_from_error_log(
    error_log_path: str,
) -> Optional[Dict[str, Any]]:
    """
    log_error.txt 파일을 읽어서 가장 마지막으로 오답 재풀이에 성공한 문제 정보를 추출합니다.
    """
    if not os.path.exists(error_log_path):
        return None

    last_started = None
    last_success = None
    matched_count = 0
    total_processed = 0

    with open(error_log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            # 오답 재풀이 문제 시작 로그 형식:
            # [1/42] (원래 전체 11번) Script: 1787100000001 | 문제 #11
            prob_match = re.search(
                r"\[(\d+)/(\d+)\]\s*\(원래 전체\s*(\d+)번\)\s*Script:\s*(\S+)\s*\|\s*문제 #(\d+)",
                line,
            )
            if prob_match:
                last_started = {
                    "wrong_idx": int(prob_match.group(1)),
                    "total_wrong": int(prob_match.group(2)),
                    "global_idx": int(prob_match.group(3)),
                    "script_id": prob_match.group(4),
                    "p_num": int(prob_match.group(5)),
                }

            # 성공 완료 로그: 🤖 LLM 예측 정답:
            if "LLM 예측 정답:" in line and last_started is not None:
                last_success = dict(last_started)
                total_processed += 1
                if "MATCH (일치)" in line or "✅" in line:
                    matched_count += 1

    if last_success:
        last_success["matched_count"] = matched_count
        last_success["total_processed"] = total_processed

    return last_success


# ==========================================
# 5. 카운트다운 대기 함수
# ==========================================
def countdown_sleep(seconds: float):
    """대기 시간 동안 남은 초를 표시하며 안전하게 대기합니다."""
    total_secs = int(seconds)
    if total_secs <= 0:
        return

    logger.info(f"⏳ 다음 호출 요청까지 {total_secs}초 대기합니다...")
    for remaining in range(total_secs, 0, -1):
        if sys.stdout.isatty():
            sys.stdout.write(f"\r  ⏳ 남은 대기 시간: {remaining:2d}초... ")
            sys.stdout.flush()
        time.sleep(1)

    if sys.stdout.isatty():
        sys.stdout.write("\r" + " " * 45 + "\r")
        sys.stdout.flush()


# ==========================================
# 6. LLM 문제 풀이 함수 정의
# ==========================================
def solve_single_problem(
    question: str,
    description: str,
    choices: list[str],
    max_retries: Optional[int] = None,
    retry_delay: float = 2.0,
) -> Optional[ProblemSolution]:
    """LLM에게 question, description, choices만 전달하여 정답 및 해설을 생성합니다. (실제 정답은 절대 전달하지 않음)"""
    if max_retries is None:
        max_retries = max(len(key_manager.key_entries), 1)

    prompt_parts = [
        "다음 시험 문제를 신중하고 정확하게 풀고 가장 알맞은 정답 번호(1~N), 종합 해설, 각 선택지별 정오답 이유, 핵심 개념을 작성해줘.",
        "",
        f"[문제 질문]\n{question.strip()}",
    ]

    if description and description.strip():
        prompt_parts.append(f"\n[지문 / 보기 내용]\n{description.strip()}")

    prompt_parts.append("\n[선택지]")
    for idx, choice in enumerate(choices, start=1):
        prompt_parts.append(f"{idx}. {choice.strip()}")

    prompt_parts.append(
        f"\n[주의사항]\n"
        f"- 반드시 1번부터 {len(choices)}번 중 가장 적절한 정답 번호를 predicted_answer에 정수로 기재하세요.\n"
        f"- 지문 및 각 선택지의 미세한 단어, 법령 기준, 계산 조건 등을 꼼꼼하게 검토하여 오답을 피하세요.\n"
        f"- choice_explanations 리스트에는 1번부터 {len(choices)}번까지 각 선택지가 정답인 이유 또는 오답인 이유를 순서대로 빠짐없이 총 {len(choices)}개 작성하세요."
    )

    full_prompt = "\n".join(prompt_parts)

    for attempt in range(1, max_retries + 1):
        active_key_label = key_manager.current_key_label
        try:
            response = key_manager.client.models.generate_content(
                model=MODEL_NAME,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ProblemSolution,
                    temperature=0.1,  # 오답 재풀이이므로 보다 엄밀한 추론을 위해 낮은 temperature
                ),
            )
            parsed = ProblemSolution.model_validate_json(response.text)

            key_manager.record_success()

            # 선택지 개수와 choice_explanations 길이가 맞지 않을 경우 패딩/자르기 보정
            if len(parsed.choice_explanations) < len(choices):
                parsed.choice_explanations.extend(
                    [""] * (len(choices) - len(parsed.choice_explanations))
                )
            elif len(parsed.choice_explanations) > len(choices):
                parsed.choice_explanations = parsed.choice_explanations[: len(choices)]

            return parsed
        except AllKeysExhaustedError:
            raise
        except APIError as e:
            err_msg = str(e)
            is_quota_error = (
                "429" in err_msg
                or "RESOURCE_EXHAUSTED" in err_msg
                or "Quota" in err_msg
                or "quota" in err_msg
            )
            if is_quota_error:
                logger.warning(
                    f"  ⚠️ [{active_key_label}] [할당량/토큰 한도 초과] 할당량 초과 1회 감지 -> 즉시 다음 키로 전환합니다: {e}"
                )
                key_manager.switch_to_next_key()
                logger.info(f"  ⚡ 다음 키({key_manager.current_key_label})로 즉시 재시도합니다.")
                time.sleep(1.0)
            else:
                switched = key_manager.record_error(e)
                if switched:
                    logger.info(f"  ⚡ 다음 키({key_manager.current_key_label})로 즉시 재시도합니다.")
                    time.sleep(1.0)
                else:
                    wait_time = retry_delay * attempt
                    logger.warning(
                        f"  ⚠️ [{active_key_label}] [APIError] 시도 {attempt}/{max_retries} 실패: {e}. {wait_time}초 대기 후 재시도..."
                    )
                    time.sleep(wait_time)
        except Exception as e:
            switched = key_manager.record_error(e)
            if switched:
                logger.info(f"  ⚡ 다음 키({key_manager.current_key_label})로 즉시 재시도합니다.")
                time.sleep(1.0)
            else:
                wait_time = retry_delay * attempt
                logger.warning(
                    f"  ⚠️ [{active_key_label}] [Exception] 시도 {attempt}/{max_retries} 실패: {e}. {wait_time}초 대기 후 재시도..."
                )
                time.sleep(wait_time)

    logger.error("  ❌ 모든 재시도를 소진하여 문제 풀이에 실패했습니다.")
    return None


# ==========================================
# 7. 오답 전용 메인 실행 프로세스
# ==========================================
def process_wrong_answers(
    max_problems: Optional[int] = None,
    delay_between_requests: float = DEFAULT_DELAY_SECONDS,
    resume: bool = True,
):
    """
    log.txt에서 mismatch로 판별된 오답 문제들만 선별하여 다시 풀이하고
    결과를 default_result.json 및 log_error.txt에 기록합니다.
    - resume: True일 경우 log_error.txt를 검사하여 마지막으로 처리된 오답 문제 다음부터 이어서 진행합니다.
    """
    logger.info("=" * 65)
    logger.info("🎯 Gemini 오답(MISMATCH) 집중 재풀이 시스템 가동")
    logger.info(f"📁 결과 파일: {RESULT_FILE}")
    logger.info(f"📋 원본 로그: {ORIGINAL_LOG_FILE}")
    logger.info(f"📝 오답 로그: {LOG_FILE}")
    logger.info(f"⏱️ 호출 간 대기 시간: {delay_between_requests}초")
    logger.info("=" * 65)

    # 1. 결과 파일(또는 원본 파일) 로드
    target_data_file = RESULT_FILE if os.path.exists(RESULT_FILE) else INPUT_FILE
    if not os.path.exists(target_data_file):
        logger.error(f"대상 데이터 파일이 존재하지 않습니다: {target_data_file}")
        return

    with open(target_data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    scripts = data.get("scripts", {})

    # 2. 전체 문제 목록 인덱싱 (script_id, p_idx)
    # flat_map: (script_id, p_num) -> (global_idx, problem_obj)
    flat_problems_map = {}
    flat_problems_list = []
    g_idx = 1
    for script_id, script_obj in scripts.items():
        problems = script_obj.get("problems", [])
        for p_idx, problem in enumerate(problems):
            p_num = p_idx + 1
            flat_problems_map[(script_id, p_num)] = (g_idx, p_idx, problem)
            flat_problems_list.append((g_idx, script_id, p_idx, problem))
            g_idx += 1

    # 3. log.txt에서 mismatch 문제 식별
    mismatch_ids = extract_mismatch_problem_identifiers(ORIGINAL_LOG_FILE)

    # 만약 log.txt에서 mismatch를 못 찾았을 경우 default_result.json의 isLlmMatch=False fallback
    if not mismatch_ids:
        logger.info("ℹ️ log.txt에서 mismatch 항목을 찾지 못하여, default_result.json의 isLlmMatch=False 항목을 탐색합니다.")
        for g_idx, script_id, p_idx, problem in flat_problems_list:
            if problem.get("isLlmProcessed") and not problem.get("isLlmMatch"):
                mismatch_ids.append((g_idx, script_id, p_idx + 1))

    # 오답 문제 객체 리스트 구성
    wrong_problems = []
    for g_id, s_id, p_num in mismatch_ids:
        key = (s_id, p_num)
        if key in flat_problems_map:
            actual_g_id, p_idx, problem_obj = flat_problems_map[key]
            wrong_problems.append((actual_g_id, s_id, p_idx, problem_obj))

    total_wrong = len(wrong_problems)
    logger.info(f"🔍 총 {total_wrong}개의 오답(MISMATCH) 문제를 발견했습니다.")

    if total_wrong == 0:
        logger.info("🎉 재풀이할 오답 문제가 없습니다. 작업을 종료합니다.")
        return

    # 4. log_error.txt 기반 이어하기 (Resume Point)
    start_wrong_idx = 1
    matched_count = 0
    skipped_count = 0

    if resume:
        last_error_log = get_last_successful_problem_from_error_log(LOG_FILE)
        if last_error_log:
            last_w_idx = last_error_log["wrong_idx"]
            matched_count = last_error_log.get("matched_count", 0)
            skipped_count = last_w_idx
            start_wrong_idx = last_w_idx + 1
            logger.info(
                f"📌 [오답 이어하기 감지] log_error.txt 기록 기준 마지막 완료 오답 문제: "
                f"오답 #{last_w_idx}/{total_wrong} (원래 전체 {last_error_log['global_idx']}번, Script: {last_error_log['script_id']}, 문제 #{last_error_log['p_num']})"
            )
            logger.info(
                f"➡️  다음 오답 문제인 [{start_wrong_idx}/{total_wrong}]번부터 이어서 작업을 진행합니다."
            )
        else:
            logger.info("📌 log_error.txt에서 이전 완료 기록이 없어 1번째 오답 문제부터 시작합니다.")

    processed_count = 0
    error_count = 0

    try:
        for wrong_idx in range(start_wrong_idx, total_wrong + 1):
            if max_problems is not None and processed_count >= max_problems:
                logger.info(f"🎯 지정된 최대 문제 처리 수({max_problems}개)에 도달하여 작업을 종료합니다.")
                break

            global_idx, script_id, p_idx, problem = wrong_problems[wrong_idx - 1]
            p_num = p_idx + 1

            question = problem.get("question", "")
            description = problem.get("description", "")
            choices = problem.get("choices", [])
            actual_answer = problem.get("answer")
            actual_answers = problem.get("answers", [actual_answer])
            prev_llm_answer = problem.get("llmPredictedAnswer")

            logger.info("-" * 65)
            logger.info(
                f"[{wrong_idx}/{total_wrong}] (원래 전체 {global_idx}번) Script: {script_id} | 문제 #{p_num}"
            )
            logger.info(
                f"  질문: {question[:70]}..." if len(question) > 70 else f"  질문: {question}"
            )
            logger.info(
                f"  실제 정답: {actual_answer} (복수정답: {actual_answers}) | 이전 LLM 예측: {prev_llm_answer}"
            )

            # LLM 호출 (실제 정답은 절대 전달하지 않음)
            solution = solve_single_problem(
                question=question,
                description=description,
                choices=choices,
            )

            if solution is None:
                logger.error(
                    f"  ❌ [{wrong_idx}/{total_wrong}] 문제 해설 생성 실패. 다음 오답 문제로 넘어갑니다."
                )
                error_count += 1
                continue

            predicted_ans = solution.predicted_answer
            is_match = (predicted_ans == actual_answer) or (predicted_ans in actual_answers)

            processed_count += 1
            if is_match:
                matched_count += 1
                match_symbol = "✅ MATCH (일치 - 오답 극복 성공!)"
            else:
                match_symbol = "❌ MISMATCH (여전히 불일치)"

            total_done = skipped_count + processed_count
            accuracy = (matched_count / total_done) * 100 if total_done > 0 else 0

            logger.info(
                f"  🤖 LLM 예측 정답: {predicted_ans} -> {match_symbol} "
                f"(오답 재풀이 성공률: {matched_count}/{total_done} = {accuracy:.1f}%)"
            )
            logger.info(f"  🔑 핵심 개념: {solution.key_concept}")

            # 문제 객체 업데이트
            problem["explanation"] = solution.explanation
            problem["choiceExplanations"] = solution.choice_explanations
            problem["llmPredictedAnswer"] = solution.predicted_answer
            problem["llmKeyConcept"] = solution.key_concept
            problem["isLlmMatch"] = is_match
            problem["isLlmProcessed"] = True

            # 중간 저장 (매 문제 성공 시마다 default_result.json에 안전하게 덮어쓰기 저장)
            try:
                with open(RESULT_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception as save_err:
                logger.error(f"  ⚠️ 결과 파일({RESULT_FILE}) 저장 중 에러 발생: {save_err}")

            # 마지막 오답 문제가 아니면 delay_between_requests초 대기
            if wrong_idx < total_wrong and (
                max_problems is None or processed_count < max_problems
            ):
                if delay_between_requests > 0:
                    countdown_sleep(delay_between_requests)

    except AllKeysExhaustedError as e:
        logger.error("=" * 65)
        logger.error(f"🛑 [프로세스 종료] {e}")
        logger.error("🛑 처음 로드된 모든 API 키의 1바퀴 순회가 완료되어 현재까지의 진행 상황을 안전하게 저장하고 스크립트를 종료합니다.")
        logger.error("=" * 65)
    except KeyboardInterrupt:
        logger.warning("\n⚠️ 사용자에 의해 작업이 강제 중단(KeyboardInterrupt)되었습니다.")
    finally:
        logger.info("=" * 65)
        logger.info("🎉 오답 재풀이 세션이 종료되었습니다.")
        total_effective = skipped_count + processed_count
        logger.info(
            f"📊 결과 요약: 이번 세션 처리={processed_count}, 이전 완료 스킵={skipped_count}, "
            f"총 완료={total_effective}/{total_wrong}, 일치={matched_count}, 오류={error_count}"
        )
        if total_effective > 0:
            final_acc = (matched_count / total_effective) * 100
            logger.info(f"🏆 오답 재풀이 성공률: {final_acc:.2f}% ({matched_count}/{total_effective})")
        logger.info(f"📁 결과 파일 저장 위치: {RESULT_FILE}")
        logger.info(f"📝 오답 로그 파일 위치: {LOG_FILE}")
        logger.info("=" * 65)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="log.txt의 MISMATCH 오답 문제들을 대상으로 Gemini LLM 해설을 다시 풀이합니다."
    )
    parser.add_argument(
        "--max",
        type=int,
        default=None,
        help="처리할 최대 오답 문제 수 (미지정 시 전체 오답 문제 끝까지 처리)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY_SECONDS,
        help=f"요청 완료 후 대기 시간 (초, 기본값: {DEFAULT_DELAY_SECONDS}초)",
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="log_error.txt 이어하기를 무시하고 1번째 오답 문제부터 다시 실행",
    )

    args = parser.parse_args()

    process_wrong_answers(
        max_problems=args.max,
        delay_between_requests=args.delay,
        resume=not args.no_resume,
    )
