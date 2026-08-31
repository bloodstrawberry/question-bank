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

# Let's check 2-character words that are split as 'X Y' e.g. '부 동', '동 산', '수 요', '공 급'
# We want to check if they are real splits or legitimate 1-letter words (e.g. '할 수', '조 제', '만 원', '그 후', '더 큰')

# Common legitimate 1-char combinations:
legit_1_char = {
    '조 제', '할 수', '항 제', '될 수', '만 원', '법 제', '볼 수', '회 차', '할 때', '및 그',
    '둘 수', '개 층', '년 후', '년 차', '한 그', '한 후', '한 자', '이 그', '조 및', '알 수',
    '은 그', '그 후', '둘 다', '일 때', '만 명', '은 제', '억 원', '라 함', '년 중', '더 큰',
    '의 월', '큰 것', '및 제', '후 그', '후 각', '이 법', '그 중', '그 제', '이 때', '이 제',
    '를 한', '일 전', '조 등', '경 우', '두 개', '된 후', '일 후', '한 제', '해 준', '는 그',
    '은 선', '이 더', '한 뒤', '년 간', '도 및', '은 시', '및 시', '인 본', '때 그', '령 및',
    '이 한', '전 그', '항 각', '말 연', '될 뿐', '타 주', '이 중', '는 두', '한 각', '을 뺀',
    '시 그', '등 그', '층 및', '전 및', '다 낸', '및 총', '소 및', '및 동', '볼 것', '고 한',
    '전 각', '일 중', '과 그', '일 등', '및 각', '는 연', '의 다', '바 움', '한 점', '둔 채',
    '은 연', '해 줄', '의 세', '는 제', '관 한', '월 월', '일 시', '과 매', '과 제', '중 시',
    '그 분', '년 내', '를 그', '군 수', '된 자', '할 것', '자 간', '일 간', '군 및', '장 및',
    '아 니', '등 제', '낸 뒤', '및 인', '따 라', '점 및', '관 및', '보 다', '는 건', '갈 때',
    '내 집', '안 때', '은 위', '한 위', '가 제', '이 잔', '은 잔', '그 뜻', '인 점', '더 긴',
    '클 때', '이 총', '및 연', '가 이', '시 잔', '그 등', '후 양', '은 각', '가 그', '로 총',
    '한 국', '중 순', '는 약', '의 앞', '을 복'
}

suspicious_2_char = []
for orig, joined, count in candidates:
    if len(orig.split()) == 2 and len(orig.replace(' ', '')) == 2:
        if orig not in legit_1_char:
            suspicious_2_char.append((orig, joined, count))

with open('scratch/suspicious_2_char_splits.txt', 'w', encoding='utf-8') as f:
    f.write(f"=== SUSPICIOUS 2-CHAR SPLITS ({len(suspicious_2_char)} items) ===\n\n")
    for orig, joined, count in suspicious_2_char:
        f.write(f"'{orig}' -> '{joined}' ({count}회)\n")

print(f"Suspicious 2-char splits: {len(suspicious_2_char)}")
