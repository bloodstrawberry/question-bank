import os
import sys
import subprocess

# Windows 콘솔 한글 깨짐 방지
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    js_crawler = os.path.join(current_dir, "crawler.js")

    if not os.path.exists(js_crawler):
        print(f"❌ [오류] {js_crawler} 파일이 존재하지 않습니다.")
        sys.exit(1)

    print("🚀 [SQLD양파] 기출문제 크롤러 실행 (crawler.js 호출)...")
    try:
        result = subprocess.run(
            ["node", js_crawler],
            cwd=current_dir,
            text=True,
            capture_output=True,
            encoding="utf-8"
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        if result.returncode != 0:
            print(f"❌ 크롤러 실행 실패 (Exit Code: {result.returncode})")
            sys.exit(result.returncode)
    except FileNotFoundError:
        print("❌ [오류] Node.js 환경이 설치되어 있지 않거나 PATH에 등록되지 않았습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ [오류] 실행 중 에러 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
