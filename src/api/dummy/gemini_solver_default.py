import os
import sys
import json
import time
import re
import logging
from typing import Optional, Dict, Any

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
OUTPUT_FILE = os.path.join(BASE_DIR, "default_result.json")
LOG_FILE = os.path.join(BASE_DIR, "log.txt")

DEFAULT_DELAY_SECONDS = 10.0  # 호출 완료 후 기본 대기 시간 (10초)
MODEL_NAME = "gemini-3.6-flash"

# Logger 설정 (콘솔 + log.txt 동시 출력 및 즉시 플러시)
logger = logging.getLogger("GeminiSolver")
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
# 환경 변수 및 .env에서 GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... 순서대로 모두 자동 감지/로드
key_dict = {}
for k, v in os.environ.items():
    match = re.match(r"^GEMINI_API_KEY_(\d+)$", k)
    if match and v and v.strip():
        key_dict[int(match.group(1))] = (k, v.strip())

if key_dict:
    # 키 번호(1, 2, 3, 4, 5, ...) 순으로 정렬하여 리스트 생성
    API_KEYS = [key_dict[num] for num in sorted(key_dict.keys())]
else:
    # 단일 GEMINI_API_KEY 하위 호환
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
    GEMINI API 키들을 순차적으로 관리하며, 3회 이상 에러 발생 시 다음 키로 자동 전환합니다.
    모든 키가 연속으로 실패하여 한 바퀴를 완전히 순회했을 경우 AllKeysExhaustedError를 발생시킵니다.
    """

    def __init__(self, key_entries: list[tuple[str, str]], max_errors_per_key: int = 3):
        self.key_entries = key_entries
        self.max_errors = max_errors_per_key
        self.current_idx = 0
        self.consecutive_errors = 0
        self.consecutive_failed_keys = 0  # 연속으로 max_errors에 도달하여 실패한 키의 개수
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
        """
        에러 발생 시 카운트 증가.
        max_errors(3회) 이상이면 다음 키로 전환하고 True 반환, 아니면 False 반환.
        모든 키가 한 바퀴 모두 실패했을 경우 AllKeysExhaustedError 발생.
        """
        self.consecutive_errors += 1
        logger.warning(
            f"  ⚠️ [{self.current_key_label}] 에러 누적 ({self.consecutive_errors}/{self.max_errors}): {err}"
        )
        if self.consecutive_errors >= self.max_errors:
            self.switch_to_next_key()
            return True
        return False

    def switch_to_next_key(self):
        """다음 API 키로 전환 또는 모든 키 소진 시 AllKeysExhaustedError 발생"""
        self.consecutive_failed_keys += 1
        old_label = self.current_key_label

        # 등록된 모든 키를 한 바퀴 다 순회하면서 실패했는지 검사
        if self.consecutive_failed_keys >= len(self.key_entries):
            logger.error("=" * 65)
            logger.error(
                f"🛑 [모든 키 점검 완료 / 소진] 등록된 총 {len(self.key_entries)}개의 API 키가 "
                f"모두 각각 {self.max_errors}회 이상 에러가 발생하여 한 바퀴({len(self.key_entries)}개 키)를 완전히 순회했습니다."
            )
            logger.error(
                f"🛑 마지막 점검 키: {old_label} (누적 소진 키: {self.consecutive_failed_keys}/{len(self.key_entries)})"
            )
            logger.error("=" * 65)
            raise AllKeysExhaustedError(
                f"모든 Gemini API 키({len(self.key_entries)}개)의 할당량/호출 한도가 초과되어 한 바퀴 점검을 완료했습니다."
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
            f"  🔄 [API 키 전환] {old_label}에서 {self.max_errors}회 이상 에러가 발생하여 "
            f"{new_label} (키 인덱스 {self.current_idx + 1}/{len(self.key_entries)}, "
            f"연속 소진 키: {self.consecutive_failed_keys}/{len(self.key_entries)})로 자동 전환합니다."
        )
        self.client = genai.Client(api_key=self.current_key)


key_manager = GeminiKeyManager(API_KEYS, max_errors_per_key=3)
key_names = ", ".join([label for label, _ in API_KEYS])
logger.info(f"🔑 총 {len(API_KEYS)}개의 Gemini API 키 로드 완료 ({key_names}). 현재 사용 중인 키: {key_manager.current_key_label}")


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
# 4. log.txt 분석을 통한 마지막 성공 위치 탐색 함수
# ==========================================
def get_last_successful_problem_from_log(log_path: str) -> Optional[Dict[str, Any]]:
    """
    log.txt 파일을 읽어서 가장 마지막으로 LLM 호출 및 처리에 성공한 문제 정보를 추출합니다.
    """
    if not os.path.exists(log_path):
        return None

    last_started = None
    last_success = None
    matched_count = 0
    total_processed = 0

    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            # 문제 시작 로그: [1/1400] Script: 1787100000001 | 문제 #1
            prob_match = re.search(r"\[(\d+)/(\d+)\] Script:\s*(\S+)\s*\|\s*문제 #(\d+)", line)
            if prob_match:
                last_started = {
                    "global_idx": int(prob_match.group(1)),
                    "total_in_log": int(prob_match.group(2)),
                    "script_id": prob_match.group(3),
                    "p_num": int(prob_match.group(4)),
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
# 5. 카운트다운 대기 함수 (30초 대기)
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
    retry_delay: float = 3.0,
) -> Optional[ProblemSolution]:
    """LLM에게 question, description, choices만 전달하여 정답 및 해설을 생성합니다. (실제 정답은 절대 전달하지 않음)"""
    if max_retries is None:
        # 키 개수 * 3회 에러 + 여유분(5회)으로 동적 산출하여 키 전환 도중 조기 실패 방지
        max_retries = max(12, len(key_manager.key_entries) * key_manager.max_errors + 5)

    prompt_parts = [
        "다음 시험 문제를 풀고 가장 알맞은 정답 번호(1~N), 종합 해설, 각 선택지별 정오답 이유, 핵심 개념을 작성해줘.",
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
                    temperature=0.2,
                ),
            )
            parsed = ProblemSolution.model_validate_json(response.text)

            # 성공 시 현재 키의 연속 에러 카운트 및 연속 실패 키 리셋
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
            # 모든 키가 한 바퀴 모두 실패했을 때 상위 루프로 즉시 전파
            raise
        except APIError as e:
            err_msg = str(e)
            switched = key_manager.record_error(e)
            if switched:
                logger.info(f"  ⚡ 다음 키({key_manager.current_key_label})로 즉시 재시도합니다.")
                time.sleep(1.0)
            elif "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "Quota" in err_msg:
                wait_time = 15 * min(attempt, 4)
                logger.warning(
                    f"  ⚠️ [{active_key_label}] [할당량/토큰 한도 초과] {wait_time}초 대기 후 재시도합니다 (시도 {attempt}/{max_retries})..."
                )
                time.sleep(wait_time)
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

    logger.error("  ❌ 최대 재시도 횟수를 초과하여 문제 풀이에 실패했습니다.")
    return None


# ==========================================
# 7. 메인 실행 프로세스
# ==========================================
def process_default_json(
    max_problems: Optional[int] = None,
    delay_between_requests: float = DEFAULT_DELAY_SECONDS,
    resume: bool = True,
):
    """
    default.json의 모든 문제에 대해 LLM 해설을 생성하고 default_result.json 및 log.txt에 기록합니다.
    - resume: True일 경우 log.txt 및 default_result.json을 검사하여 마지막으로 성공한 다음 문제부터 이어서 진행합니다.
    """
    logger.info("=" * 65)
    logger.info("🚀 Gemini 문제 해설 자동 생성 시스템 가동")
    logger.info(f"📁 입력 파일: {INPUT_FILE}")
    logger.info(f"📁 출력 파일: {OUTPUT_FILE}")
    logger.info(f"📝 로그 파일: {LOG_FILE}")
    logger.info(f"⏱️ 호출 간 대기 시간: {delay_between_requests}초")
    logger.info("=" * 65)

    if not os.path.exists(INPUT_FILE):
        logger.error(f"입력 파일이 존재하지 않습니다: {INPUT_FILE}")
        return

    # 1. 원본 데이터 및 기존 결과 데이터 로드
    if resume and os.path.exists(OUTPUT_FILE):
        logger.info(f"기존 결과 파일({OUTPUT_FILE})을 로드합니다.")
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

    scripts = data.get("scripts", {})

    # 전체 문제 평탄화 (Flat list of problems)
    flat_problems = []
    for script_id, script_obj in scripts.items():
        problems = script_obj.get("problems", [])
        for p_idx, problem in enumerate(problems):
            flat_problems.append((script_id, p_idx, problem))

    total_problems = len(flat_problems)

    # 2. log.txt 기반 마지막 성공 위치 감지 (Resume Point)
    start_global_idx = 1
    matched_count = 0
    skipped_count = 0

    if resume:
        last_log_success = get_last_successful_problem_from_log(LOG_FILE)
        if last_log_success:
            last_idx = last_log_success["global_idx"]
            matched_count = last_log_success.get("matched_count", 0)
            skipped_count = last_idx
            start_global_idx = last_idx + 1
            logger.info(
                f"📌 [이어하기 감지] log.txt 기록 기준 마지막 성공 문제: "
                f"전체 {last_idx}번 (Script: {last_log_success['script_id']}, 문제 #{last_log_success['p_num']})"
            )
            logger.info(
                f"➡️  다음 문제인 전체 [{start_global_idx}/{total_problems}]번부터 이어서 작업을 진행합니다."
            )
        else:
            logger.info("📌 log.txt에서 이전 성공 기록이 없어 처음부터 시작합니다.")

    processed_count = 0
    error_count = 0

    try:
        for global_idx in range(start_global_idx, total_problems + 1):
            if max_problems is not None and processed_count >= max_problems:
                logger.info(f"🎯 지정된 최대 문제 처리 수({max_problems}개)에 도달하여 작업을 종료합니다.")
                break

            script_id, p_idx, problem = flat_problems[global_idx - 1]

            question = problem.get("question", "")
            description = problem.get("description", "")
            choices = problem.get("choices", [])
            actual_answer = problem.get("answer")
            actual_answers = problem.get("answers", [actual_answer])

            logger.info("-" * 65)
            logger.info(
                f"[{global_idx}/{total_problems}] Script: {script_id} | 문제 #{p_idx + 1}"
            )
            logger.info(
                f"  질문: {question[:70]}..." if len(question) > 70 else f"  질문: {question}"
            )
            logger.info(f"  실제 정답: {actual_answer} (복수정답: {actual_answers})")

            # LLM 호출 (실제 정답은 절대 전달하지 않음)
            solution = solve_single_problem(
                question=question,
                description=description,
                choices=choices,
            )

            if solution is None:
                logger.error(
                    f"  ❌ [{global_idx}/{total_problems}] 문제 해설 생성 실패. 다음 문제로 넘어갑니다."
                )
                error_count += 1
                continue

            predicted_ans = solution.predicted_answer
            is_match = (predicted_ans == actual_answer) or (predicted_ans in actual_answers)

            processed_count += 1
            if is_match:
                matched_count += 1
                match_symbol = "✅ MATCH (일치)"
            else:
                match_symbol = "❌ MISMATCH (불일치)"

            total_done = skipped_count + processed_count
            accuracy = (matched_count / total_done) * 100 if total_done > 0 else 0

            logger.info(
                f"  🤖 LLM 예측 정답: {predicted_ans} -> {match_symbol} "
                f"(누적 정답률: {matched_count}/{total_done} = {accuracy:.1f}%)"
            )
            logger.info(f"  🔑 핵심 개념: {solution.key_concept}")

            # 문제 객체 업데이트
            problem["explanation"] = solution.explanation
            problem["choiceExplanations"] = solution.choice_explanations
            problem["llmPredictedAnswer"] = solution.predicted_answer
            problem["llmKeyConcept"] = solution.key_concept
            problem["isLlmMatch"] = is_match
            problem["isLlmProcessed"] = True

            # 중간 저장 (매 문제 성공 시마다 안전하게 덮어쓰기 저장)
            try:
                with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception as save_err:
                logger.error(f"  ⚠️ 결과 파일({OUTPUT_FILE}) 저장 중 에러 발생: {save_err}")

            # 마지막 문제가 아니면 delay_between_requests초 대기
            if global_idx < total_problems and (
                max_problems is None or processed_count < max_problems
            ):
                if delay_between_requests > 0:
                    countdown_sleep(delay_between_requests)

    except AllKeysExhaustedError as e:
        logger.error("=" * 65)
        logger.error(f"🛑 [프로세스 중단] {e}")
        logger.error("🛑 모든 API 키의 할당량이 소진되어 현재까지의 진행 상황을 안전하게 저장하고 종료합니다.")
        logger.error("=" * 65)
    except KeyboardInterrupt:
        logger.warning("\n⚠️ 사용자에 의해 작업이 강제 중단(KeyboardInterrupt)되었습니다.")
    finally:
        logger.info("=" * 65)
        logger.info("🎉 작업 세션이 종료되었습니다.")
        total_effective = skipped_count + processed_count
        logger.info(
            f"📊 결과 요약: 이번 세션 처리={processed_count}, 이전 완료 스킵={skipped_count}, "
            f"총 완료={total_effective}/{total_problems}, 일치={matched_count}, 오류={error_count}"
        )
        if total_effective > 0:
            final_acc = (matched_count / total_effective) * 100
            logger.info(f"🏆 전체 일치율: {final_acc:.2f}%")
        logger.info(f"📁 결과 파일 저장 위치: {OUTPUT_FILE}")
        logger.info(f"📝 로그 파일 위치: {LOG_FILE}")
        logger.info("=" * 65)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="default.json의 문제들에 Gemini LLM 해설 및 선택지 해설을 추가합니다."
    )
    parser.add_argument(
        "--max",
        type=int,
        default=None,
        help="처리할 최대 문제 수 (테스트용, 미지정 시 전체 1400개 문제 끝까지 처리)",
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
        help="log.txt 이어하기를 무시하고 1번 문제부터 다시 실행",
    )

    args = parser.parse_args()

    process_default_json(
        max_problems=args.max,
        delay_between_requests=args.delay,
        resume=not args.no_resume,
    )