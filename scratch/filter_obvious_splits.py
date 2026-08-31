import json
import re

with open('scratch/all_split_candidates.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

candidates = []
for line in lines:
    m = re.match(r"'([^']+)' -> '([^']+)' \((\d+)회\)", line)
    if m:
        orig, joined, count = m.group(1), m.group(2), int(m.group(3))
        candidates.append((orig, joined, count))

# Let's find all pairs where 'orig' contains 1-letter space split that definitely forms a single word
# We can filter by examining common words/endings

def is_obvious_split(orig, joined):
    # Rule 1: contains ~재 as goods (정상재, 대체재, etc.)
    if re.match(r'^(정상|대체|보완|열등|우등|독립|공공|소비|생산|중간|투자|기펜|사치|필수) 재', orig):
        return True
    # Rule 2: 절댓값
    if '절' in orig and ('댓' in orig or '값' in orig) and '절댓' in joined:
        return True
    # Rule 3: 짝지어
    if orig.startswith('짝 지') or orig.startswith('짝 짓'):
        return True
    # Rule 4: Terminology list
    single_word_terms = [
        '포락지', '이행지', '후보지', '표준지', '경계점', '도곽선', '송수관', '송유관',
        '담보부', '임대부', '분사무소', '복대리', '시산가액', '시산가격', '시산임료',
        '감채기금', '승역지', '요역지', '탄력성', '기울기', '수익률', '환원율',
        '원리금', '연와조', '집하장', '선매자', '관망탑', '배액', '산식', '안분',
        '타주점유', '제척기간', '임장활동', '견련관계', '일물일권', '점증상환',
        '없더라도', '다핵심이론', '방해배제', '신고필증', '등록필증', '등기필증',
        '지상경계점등록부', '공시지가', '중개사무소', '우하향', '우상향', '좌하향', '좌상향',
        '삼각점', '위치설명도', '기업어음', '부동산투자회사', '설명도', '표제부',
        '경개계약', '궁박', '복대리인', '복대리권', '감채', '시산', '승역', '요역', '포락'
    ]
    for term in single_word_terms:
        if joined.startswith(term) or term in joined:
            # check that orig actually has a space inside the term
            # e.g. if term is '포락지', orig might be '포 락 지' or '포락 지' or '포 락지'
            clean_orig = orig.replace(' ', '')
            if term in clean_orig and any(c + ' ' in orig for c in term[:-1]):
                return True
    return False

detected = []
for orig, joined, count in candidates:
    if is_obvious_split(orig, joined):
        detected.append((orig, joined, count))

with open('scratch/detected_splits.txt', 'w', encoding='utf-8') as f:
    f.write(f"=== DETECTED {len(detected)} SPLIT PATTERNS ===\n\n")
    for orig, joined, count in detected:
        f.write(f"{orig} -> {joined} ({count}회)\n")

print(f"Detected {len(detected)} obvious split patterns.")
