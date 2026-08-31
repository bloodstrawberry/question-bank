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

words_to_check = [
    '시 산', '합 유', '물 납', '등 기', '감 채', '임 료', '타 주', '제 척',
    '필 증', '표 제', '임 장', '견 련', '승 역', '승 수', '입 목', '정 지',
    '군 수', '따 라', '갑 구', '빈 지', '역 수', '경 개', '이 행', '해 당',
    '매 장', '궁 박', '청 구', '갱 신', '직 접', '나 타', '일 물', '비 용',
    '점 증', '지 역', '아 니', '포 락', '요 역', '배 액', '산 식', '안 분'
]

results = {}
for word in words_to_check:
    regex = re.compile(rf'(?<![가-힣]){re.escape(word)}(?![가-힣])')
    matches = []
    for path, text in texts:
        for m in regex.finditer(text):
            start = max(0, m.start() - 25)
            end = min(len(text), m.end() + 25)
            matches.append((path, text[start:end].replace('\n', ' ')))
    if matches:
        results[word] = matches

with open('scratch/context_2char_check.txt', 'w', encoding='utf-8') as f:
    for word, matches in results.items():
        f.write(f"=== '{word}' (총 {len(matches)}회) ===\n")
        for path, sample in matches:
            f.write(f"  [{path}] {sample}\n")
        f.write("\n")

print(f"Checked {len(words_to_check)} words. Results written to scratch/context_2char_check.txt")
