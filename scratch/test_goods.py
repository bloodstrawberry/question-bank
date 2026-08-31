import json
import re

with open('src/api/dummy/default.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

texts = []
def extract(obj, path=''):
    if isinstance(obj, str):
        texts.append((path, obj))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            extract(item, f'{path}[{i}]')
    elif isinstance(obj, dict):
        for k, v in obj.items():
            extract(v, f'{path}.{k}')

extract(data)

# Test pattern for ~재
goods = ['정상', '대체', '보완', '열등', '우등', '독립', '공공', '소비', '생산', '중간', '투자', '기펜', '사치', '필수']
goods_pat = re.compile(rf"({'|'.join(goods)})\s+재")

print("=== Goods (~재) matches ===")
for path, text in texts:
    for m in goods_pat.finditer(text):
        start = max(0, m.start() - 20)
        end = min(len(text), m.end() + 20)
        print(f"[{path}] ...{text[start:end].replace(chr(10), ' ')}...")
