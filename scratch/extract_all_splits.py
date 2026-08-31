import json
import re
from collections import Counter, defaultdict

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

# Let's inspect all possible combinations of single-char splits:
# e.g. words that when joined form valid/common terms that should NOT be split in Korean
# We can check pattern: ([가-힣]+) ([가-힣]+) where either is 1 char, or 1-1-1

results = defaultdict(lambda: {'count': 0, 'samples': [], 'paths': []})

# Regex for any 2 or 3 or 4 char sequences with spaces in between
# 1. Single + Single + Single (e.g. '포 락 지', '절 댓 값')
for path, text in texts:
    # 3 single chars
    for m in re.finditer(r'(?<![가-힣])([가-힣])\s+([가-힣])\s+([가-힣])(?![가-힣])', text):
        orig = m.group(0)
        joined = m.group(1) + m.group(2) + m.group(3)
        results[(orig, joined)]['count'] += 1
        if len(results[(orig, joined)]['samples']) < 2:
            start = max(0, m.start() - 15)
            end = min(len(text), m.end() + 15)
            results[(orig, joined)]['samples'].append(text[start:end].replace('\n', ' '))
            results[(orig, joined)]['paths'].append(path)

    # 2 chars + 1 char (e.g. '정상 재', '표준 지', '경계 점')
    for m in re.finditer(r'(?<![가-힣])([가-힣]{2,4})\s+([가-힣])(?![가-힣])', text):
        orig = m.group(0)
        joined = m.group(1) + m.group(2)
        results[(orig, joined)]['count'] += 1
        if len(results[(orig, joined)]['samples']) < 2:
            start = max(0, m.start() - 15)
            end = min(len(text), m.end() + 15)
            results[(orig, joined)]['samples'].append(text[start:end].replace('\n', ' '))
            results[(orig, joined)]['paths'].append(path)

    # 1 char + 2+ chars (e.g. '절 댓값', '짝 지어진', '분 사무소', '복 대리')
    for m in re.finditer(r'(?<![가-힣])([가-힣])\s+([가-힣]{2,4})(?![가-힣])', text):
        orig = m.group(0)
        joined = m.group(1) + m.group(2)
        results[(orig, joined)]['count'] += 1
        if len(results[(orig, joined)]['samples']) < 2:
            start = max(0, m.start() - 15)
            end = min(len(text), m.end() + 15)
            results[(orig, joined)]['samples'].append(text[start:end].replace('\n', ' '))
            results[(orig, joined)]['paths'].append(path)

with open('scratch/all_split_candidates.txt', 'w', encoding='utf-8') as f:
    for (orig, joined), info in sorted(results.items(), key=lambda x: -x[1]['count']):
        f.write(f"'{orig}' -> '{joined}' ({info['count']}회)\n")
        for s in info['samples']:
            f.write(f"   예: {s}\n")

print(f"Total candidate pairs: {len(results)}")
