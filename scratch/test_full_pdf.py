import os
import sys
import json
import time
import re
import pymupdf
from google import genai
from google.genai import types
from PIL import Image

# Read .env
api_keys = []
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k_clean = k.strip()
                if k_clean.startswith("GEMINI_API_KEY"):
                    api_keys.append((k_clean, v.strip().strip("\"'")))

print(f"Loaded {len(api_keys)} API keys")

class KeyManager:
    def __init__(self, keys):
        self.keys = keys
        self.idx = 0
        self.client = genai.Client(api_key=self.keys[self.idx][1])
    
    def next_key(self):
        self.idx = (self.idx + 1) % len(self.keys)
        print(f"Switching to key {self.keys[self.idx][0]}")
        self.client = genai.Client(api_key=self.keys[self.idx][1])

km = KeyManager(api_keys)

prompt = """이 이미지는 공인중개사 시험 문제지의 한 페이지입니다. 시험지는 2단(좌측 열, 우측 열)으로 구성되어 있습니다.

이 페이지에 포함된 모든 문제에 대해 다음 3가지 영역의 Bounding Box(0~1000 정규화 좌표 [ymin, xmin, ymax, xmax])를 정확히 찾아주세요:

1. `full_box`: 문제 전체 영역 (문제 번호, 발문, 지문/보기 박스, 그림/표, 5지선다 선지 ①~⑤ 전체 포함)
2. `question_box`: 문제 발문 및 지문/보기 박스/그림 영역 (문제 번호부터 선지 시작 직전까지)
3. `choices_box`: 5지선다 객관식 선지 영역 (선지 ①번부터 ⑤번 끝까지)

[주의사항]
- 텍스트나 박스 테두리가 잘리지 않도록 상하좌우 경계를 충분히 감싸주세요.
- question_box는 번호 및 발문부터 지문/표/박스 끝까지 포함해야 합니다.
- choices_box는 ①번 선지부터 ⑤번 선지 끝까지 포함해야 합니다.
- full_box는 question_box와 choices_box를 모두 포함하는 전체 영역입니다.
- 상단 과목명/헤더나 하단 시험지 정보/페이지 번호는 제외합니다.
- 좌우 열의 경계(중앙 분리선/여백)를 침범하지 않도록 하세요.

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

pdf_path = "macro/real-estate/2020_31/2020_31_1_1_question.pdf"
doc = pymupdf.open(pdf_path)
print(f"Total pages: {len(doc)}")

all_questions = []

for page_idx in range(len(doc)):
    page_num = page_idx + 1
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    success = False
    for attempt in range(5):
        try:
            resp = km.client.models.generate_content(
                model="gemini-3.6-flash",
                contents=[img, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            raw = resp.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n", "", raw)
                raw = re.sub(r"\n```$", "", raw)
            items = json.loads(raw)
            q_nums = [it["question_number"] for it in items]
            print(f"Page {page_num}: detected {len(items)} questions -> {q_nums}")
            for it in items:
                it["page"] = page_num
                all_questions.append(it)
            success = True
            break
        except Exception as e:
            print(f"Page {page_num} attempt {attempt+1} error: {e}")
            km.next_key()
            time.sleep(1)
    if not success:
        print(f"Page {page_num} failed!")
    time.sleep(0.5)

print("\n--- Summary ---")
detected_nums = [q["question_number"] for q in all_questions]
print(f"Total detected questions: {len(detected_nums)}")
print(f"Detected sequence: {sorted(detected_nums)}")
missing = [n for n in range(1, 81) if n not in detected_nums]
print(f"Missing questions (1..80): {missing}")
