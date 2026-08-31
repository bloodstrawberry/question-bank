import json
import re
from collections import defaultdict, Counter

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

# Let's find all occurrences of:
# 1) [가-힣]{2,} [가-힣] (e.g. 정상 재, 대체 재, 보완 재, 표준 지, 경계 점, 담보 부, 임대 부, 분 사무소 등)
# 2) [가-힣] [가-힣]{2,} (e.g. 절 댓값, 짝 지어진, 복 대리, 시 산가액 등)
# 3) [가-힣] [가-힣] [가-힣] (e.g. 절 댓 값, 포 락 지, 이 행 지, 도 곽 선, 송 수 관 등)
# 4) [가-힣] [가-힣] (e.g. 시 산, 감 채, 포 락, 승 역, 요 역 등)

# Extract candidates
pattern_2plus_1 = re.compile(r'(?<![가-힣])([가-힣]{2,4})\s+([가-힣])(?![가-힣])')
pattern_1_2plus = re.compile(r'(?<![가-힣])([가-힣])\s+([가-힣]{2,4})(?![가-힣])')
pattern_1_1_1 = re.compile(r'(?<![가-힣])([가-힣])\s+([가-힣])\s+([가-힣])(?![가-힣])')
pattern_1_1 = re.compile(r'(?<![가-힣])([가-힣])\s+([가-힣])(?![가-힣])')

c_2_1 = Counter()
c_1_2 = Counter()
c_1_1_1 = Counter()
c_1_1 = Counter()

samples_2_1 = defaultdict(list)
samples_1_2 = defaultdict(list)
samples_1_1_1 = defaultdict(list)
samples_1_1 = defaultdict(list)

for path, text in texts:
    for m in pattern_2plus_1.finditer(text):
        match_str = m.group(0)
        c_2_1[match_str] += 1
        if len(samples_2_1[match_str]) < 3:
            # find surrounding context
            start = max(0, m.start() - 20)
            end = min(len(text), m.end() + 20)
            samples_2_1[match_str].append(text[start:end].replace('\n', ' '))

    for m in pattern_1_2plus.finditer(text):
        match_str = m.group(0)
        c_1_2[match_str] += 1
        if len(samples_1_2[match_str]) < 3:
            start = max(0, m.start() - 20)
            end = min(len(text), m.end() + 20)
            samples_1_2[match_str].append(text[start:end].replace('\n', ' '))

    for m in pattern_1_1_1.finditer(text):
        match_str = m.group(0)
        c_1_1_1[match_str] += 1
        if len(samples_1_1_1[match_str]) < 3:
            start = max(0, m.start() - 20)
            end = min(len(text), m.end() + 20)
            samples_1_1_1[match_str].append(text[start:end].replace('\n', ' '))

    for m in pattern_1_1.finditer(text):
        match_str = m.group(0)
        c_1_1[match_str] += 1
        if len(samples_1_1[match_str]) < 3:
            start = max(0, m.start() - 20)
            end = min(len(text), m.end() + 20)
            samples_1_1[match_str].append(text[start:end].replace('\n', ' '))

with open('scratch/comprehensive_spacing_scan.txt', 'w', encoding='utf-8') as f:
    f.write("=== 1-1-1 PATTERNS (Single + Single + Single) ===\n")
    for pat, count in c_1_1_1.most_common(100):
        f.write(f"{pat} ({count}회) -> 샘플: {samples_1_1_1[pat]}\n")

    f.write("\n=== 2+-1 PATTERNS (Word + Single) ===\n")
    for pat, count in c_2_1.most_common(200):
        f.write(f"{pat} ({count}회) -> 샘플: {samples_2_1[pat]}\n")

    f.write("\n=== 1-2+ PATTERNS (Single + Word) ===\n")
    for pat, count in c_1_2.most_common(200):
        f.write(f"{pat} ({count}회) -> 샘플: {samples_1_2[pat]}\n")

    f.write("\n=== 1-1 PATTERNS (Single + Single) ===\n")
    for pat, count in c_1_1.most_common(200):
        f.write(f"{pat} ({count}회) -> 샘플: {samples_1_1[pat]}\n")

print("Scan complete.")
