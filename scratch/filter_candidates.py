import json
import re

with open('scratch/all_split_candidates.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Patterns of valid Korean words that shouldn't be separated
# Let's search all lines in all_split_candidates.txt for words ending in '재', '값', '지', '점', '선', '관', '부', '소', '리', '율', '성', '액', '금', '법' etc.

target_suffixes = ['재', '값', '지', '점', '선', '관', '부', '소', '리', '율', '성', '액', '금', '법', '론', '계', '권', '자', '화', '형', '비', '세', '표', '원', '조', '안']

matches_found = []

for line in lines:
    if line.startswith("'"):
        # parse 'orig' -> 'joined' (N회)
        m = re.match(r"'([^']+)' -> '([^']+)' \((\d+)회\)", line)
        if m:
            orig, joined, count = m.group(1), m.group(2), int(m.group(3))
            matches_found.append((orig, joined, count))

print(f"Total entries: {len(matches_found)}")

# Filter for suspicious compound words or split words
# Let's inspect by category
with open('scratch/suspicious_splits_grouped.txt', 'w', encoding='utf-8') as f:
    f.write("=== CANDIDATES FOR CORRECTION ===\n\n")
    for orig, joined, count in matches_found:
        # Check specific known bad splits
        # 1. ends with 재 (정상재, 대체재, etc.)
        # 2. contains 댓값 / 절댓
        # 3. starts with 짝 (짝지어, etc.)
        # 4. contains 포락, 이행지, 후보지, 표준지, 경계점, 도곽선, 송수관, 담보부, 임대부, 분사무소, 복대리, 시산, 감채, 승역지, 요역지
        # 5. contains other single-character split terms
        f.write(f"{orig:20} -> {joined:15} ({count}회)\n")

