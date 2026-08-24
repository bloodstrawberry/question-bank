import os
import sys

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
if not os.environ.get("GEMINI_API_KEY"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    for _ in range(4):
        env_path = os.path.join(current_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() == "GEMINI_API_KEY":
                            os.environ["GEMINI_API_KEY"] = v.strip().strip("'\"")
                            break
            break
        current_dir = os.path.dirname(current_dir)

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# 1. API 키 확인
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("❌ [오류] GEMINI_API_KEY가 설정되지 않았습니다.")
    print("   프로젝트 루트의 .env 파일에 GEMINI_API_KEY=발급받은_키 를 추가하거나,")
    print("   터미널에서 $env:GEMINI_API_KEY='키' (PowerShell) 를 설정해주세요.")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)


# 2. 반환받을 출력 데이터 모델 정의
class ProblemSolution(BaseModel):
    answer: str = Field(description="문제의 최종 정답")
    explanation: str = Field(description="단계별 풀이 과정 및 상세 해설")
    key_concept: str = Field(description="문제 풀이에 사용된 핵심 개념이나 공식")


# 3. 문제 풀이 함수 정의
def solve_problem(problem_text: str) -> ProblemSolution:
    response = client.models.generate_content(
        model="gemini-3.6-flash",  # 속도와 비용 효율이 우수한 Gemini 모델
        contents=f"다음 문제를 풀고 정답과 상세 해설을 작성해줘:\n\n{problem_text}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ProblemSolution,
            temperature=0.2,  # 정확하고 일관된 풀이를 위해 낮은 온도로 설정
        ),
    )
    # JSON 문자열을 Pydantic 모델로 파싱하여 반환
    return ProblemSolution.model_validate_json(response.text)


# 4. 실행 예시
if __name__ == "__main__":
    sample_problem = (
        "어떤 물건을 원가에 20%의 이익을 붙여서 정가를 정했다가, "
        "정가에서 10%를 할인하여 10,800원에 판매했습니다. 이 물건의 원가는 얼마인가요?"
    )
    print("문제 풀이 요청 중...")
    result = solve_problem(sample_problem)
    print("=" * 40)
    print(f"📌 [정답]: {result.answer}")
    print(f"🔑 [핵심 개념]: {result.key_concept}")
    print("-" * 40)
    print(f"📝 [해설]:\n{result.explanation}")
    print("=" * 40)