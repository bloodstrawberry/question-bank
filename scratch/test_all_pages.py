import os
import sys
import json
import time
import re
import fitz
from PIL import Image
from google import genai
from google.genai import types

# Load .env API keys
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

print(f"Loaded {len(api_keys)} API keys: {[k[0] for k in api_keys]}")

client = genai.Client(api_key=api_keys[0][1])

pdf_path = r"src/api/dummy/korea-history/79회_심화.pdf"
doc = fitz.open(pdf_path)

print(f"Total pages: {len(doc)}")

prompt = """이 이미지는 한국사능력검정시험 문제지의 한 페이지입니다.
이 페이지에 포함된 모든 문제의 번호(1~50 사이 정수)와 각 문제의 영역을 나타내는 Bounding Box(0~1000 정규화 좌표 [ymin, xmin, ymax, xmax])를 정확히 찾아주세요.

[중요 지침]
1. 문제 번호(예: 1., 2., 3. ...)부터 시작하여 문제 발문, 사료/지문 박스, 보기, 5지선다 선지(①~⑤) 전체가 잘리지 않고 온전히 포함되어야 합니다.
2. 우측 상단의 배점 표시(예: [1점], [2점], [3점]) 및 좌측 번호가 잘리지 않도록 좌우 여백을 충분히 확보하세요.
3. 문제와 문제 사이의 구분선이나 간격을 기준으로 각 문제가 온전하게 분리되도록 하세요.
4. 시험지 상단의 헤더(시험명, 수험번호 등)나 하단의 페이지 번호는 문제에 포함되지 않아야 합니다.

반환 형식 (JSON):
[
  {
    "question_number": 1,
    "box_2d": [ymin, xmin, ymax, xmax]
  }
]
"""

all_detected = {}

for pno in range(len(doc)):
    page = doc[pno]
    # DPI 200 for crisp quality
    pix = page.get_pixmap(dpi=200)
    page_img_path = f"scratch/page_{pno+1}.png"
    pix.save(page_img_path)
    
    img = Image.open(page_img_path)
    print(f"\nAnalyzing Page {pno+1}/{len(doc)}...")
    
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=[img, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            print(f"Page {pno+1} detected questions: {[item['question_number'] for item in data]}")
            all_detected[pno+1] = data
            break
        except Exception as e:
            print(f"Attempt {attempt+1} failed on page {pno+1}: {e}")
            time.sleep(2)
    time.sleep(1)

with open("scratch/detected_boxes.json", "w", encoding="utf-8") as f:
    json.dump(all_detected, f, ensure_ascii=False, indent=2)

print("\nFinished analyzing all pages!")
