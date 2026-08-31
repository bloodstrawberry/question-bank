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

# Find all 2-char space splits: `c1 c2`
c2_counter = Counter()
c2_samples = defaultdict(list)

for path, text in texts:
    for m in re.finditer(r'(?<![가-힣])([가-힣])\s+([가-힣])(?![가-힣])', text):
        orig = m.group(0)
        c2_counter[orig] += 1
        if len(c2_samples[orig]) < 3:
            start = max(0, m.start() - 25)
            end = min(len(text), m.end() + 25)
            c2_samples[orig].append(f"[{path}] ...{text[start:end].replace(chr(10), ' ')}...")

# Print all unique 2-char space splits and their counts
with open('scratch/all_2char_pairs.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total distinct 2-char space patterns: {len(c2_counter)}\n\n")
    for pattern, count in c2_counter.most_common():
        f.write(f"'{pattern}' ({count}회):\n")
        for s in c2_samples[pattern]:
            f.write(f"   {s}\n")

print(f"Total distinct 2-char space patterns: {len(c2_counter)}")
