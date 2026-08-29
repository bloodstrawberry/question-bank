import os
import sys
import json
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
client = genai.Client(api_key=api_keys[0][1])
img = Image.open("scratch/real_estate_test/page_1.png")

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

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=[img, prompt],
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.1
    )
)

raw_text = response.text.strip()
if raw_text.startswith("```"):
    import re
    raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
    raw_text = re.sub(r"\n```$", "", raw_text)

data = json.loads(raw_text)
print("Detected questions:", [d["question_number"] for d in data])

os.makedirs("scratch/real_estate_test/crop_samples", exist_ok=True)
w, h = img.size

def safe_crop(box, pad_x=6, pad_y=6):
    ymin, xmin, ymax, xmax = box
    px_xmin = max(0, int(xmin / 1000.0 * w) - pad_x)
    px_ymin = max(0, int(ymin / 1000.0 * h) - pad_y)
    px_xmax = min(w, int(xmax / 1000.0 * w) + pad_x)
    px_ymax = min(h, int(ymax / 1000.0 * h) + pad_y)
    return img.crop((px_xmin, px_ymin, px_xmax, px_ymax))

for item in data:
    q_num = item["question_number"]
    full_img = safe_crop(item["full_box"])
    q_img = safe_crop(item["question_box"])
    c_img = safe_crop(item["choices_box"])
    
    full_img.save(f"scratch/real_estate_test/crop_samples/{q_num:02d}_full_image.png")
    q_img.save(f"scratch/real_estate_test/crop_samples/{q_num:02d}_question.png")
    c_img.save(f"scratch/real_estate_test/crop_samples/{q_num:02d}_choices.png")
    print(f"Saved Q{q_num:02d}: full={full_img.size}, question={q_img.size}, choices={c_img.size}")

with open("scratch/real_estate_test/detected_p1.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Finished!")
