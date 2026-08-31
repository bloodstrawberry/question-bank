import json
import re
import sys
from collections import Counter

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

with open('src/api/dummy/default.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

texts = []
for s_id, s in data.get('scripts', {}).items():
    for p in s.get('problems', []):
        for fld in ['question', 'description', 'explanation', 'llmKeyConcept']:
            if p.get(fld):
                texts.append(p[fld])
        for c in p.get('choices', []):
            if c:
                texts.append(c)
        for ce in p.get('choiceExplanations', []):
            if ce:
                texts.append(ce)

full_corpus = '\n'.join(texts)

suffixes = ['국', '비', '도', '령', '설', '론', '법', '계', '세', '권', '원', '처', '소', '지', '가', '액', '층', '형', '식', '률', '율', '점', '료', '금', '물', '점', '성']

print("=== Suffix splits that appear in corpus ===")
found_candidates = {}
for suf in suffixes:
    matches = re.findall(rf'([가-힣]{{2,4}})\s+({suf})(?=[은는이가을를의에와과로서부터도만로나\s\.,\?!\)\'\"\`]|[\b]|$)', full_corpus)
    c = Counter([f"{a} {b}" for a, b in matches])
    for term, count in c.items():
        found_candidates[term] = count

for term, count in sorted(found_candidates.items(), key=lambda x: x[1], reverse=True):
    print(f"{term}: {count}")
