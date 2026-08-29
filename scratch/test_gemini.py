import os
import sys
import json
from google import genai
from google.genai import types
from PIL import Image

# Read .env
api_key = None
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("GEMINI_API_KEY_1=") or line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip("\"'")
                if api_key:
                    break

print(f"API Key loaded: {bool(api_key)}")

client = genai.Client(api_key=api_key)
img = Image.open("scratch/test_pages/page_1.png")

prompt = """이 이미지는 한국사능력검정시험 문제지의 1페이지입니다.
이 페이지에 포함된 모든 문제 번호(예: 1, 2, 3, 4 등)와 각 문제의 bounding box (ymin, xmin, ymax, xmax, 0~1000 정규화 좌표)를 찾아주세요.
문제 영역은 문제 번호부터 시작하여 질문 본문, 사료/지문 박스, 보기, 선지(①~⑤) 전체를 온전히 포함해야 합니다.
상단 시험지 타이틀 영역이나 하단 페이지 번호 영역은 제외해주세요.

출력 형식(JSON):
[
  {
    "question_number": 1,
    "box_2d": [ymin, xmin, ymax, xmax]
  }
]
"""

try:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[img, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    print("Success with gemini-3.6-flash:")
    print(response.text)
except Exception as e:
    print(f"Failed: {e}")
