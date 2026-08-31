import json
import re
from collections import defaultdict

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

# Let's define comprehensive dictionary/patterns of words that were improperly split by 1 space

replacement_rules = [
    # 1. 재화 관련 (~재)
    (r'(정상|대체|보완|열등|우등|독립|공공|소비|생산|중간|투자|기펜|사치|필수)\s+재(?=[가-힣]|\b)', r'\1재'),

    # 2. 절댓값 관련
    (r'절\s*댓\s*값', '절댓값'),
    (r'절\s+댓(?=[가-힣]|\b)', '절댓'),

    # 3. 짝지어 관련
    (r'짝\s+지어', '짝지어'),
    (r'짝\s+지은', '짝지은'),
    (r'짝\s+짓', '짝짓'),

    # 4. 부동산학/감평/지적/공시 용어
    (r'포\s+락\s+지(?=[가-힣]|\b)', '포락지'),
    (r'포\s+락(?=[가-힣]|\b)', '포락'),
    (r'이\s+행\s+지(?=[가-힣]|\b)', '이행지'),
    (r'후\s+보\s+지(?=[가-힣]|\b)', '후보지'),
    (r'표준\s+지(?=[가-힣]|\b)', '표준지'),
    (r'경계\s+점(?=[가-힣]|\b)', '경계점'),
    (r'도\s+곽\s+선(?=[가-힣]|\b)', '도곽선'),
    (r'송\s+수\s+관(?=[가-힣]|\b)', '송수관'),
    (r'송유\s+관(?=[가-힣]|\b)', '송유관'),
    (r'담보\s+부(?=[가-힣]|\b)', '담보부'),
    (r'임대\s+부(?=[가-힣]|\b)', '임대부'),
    (r'분\s+사무소(?=[가-힣]|\b)', '분사무소'),
    (r'복\s+대리(?=[가-힣]|\b)', '복대리'),
    (r'시\s+산\s*가\s*액', '시산가액'),
    (r'시\s+산\s*가\s*격', '시산가격'),
    (r'시\s+산\s*임\s*료', '시산임료'),
    (r'시\s+산(?=[가-힣]|\b)', '시산'),
    (r'감\s+채\s*기\s*금', '감채기금'),
    (r'감\s+채(?=[가-힣]|\b)', '감채'),
    (r'승\s+역\s*지(?=[가-힣]|\b)', '승역지'),
    (r'승\s+역(?=[가-힣]|\b)', '승역'),
    (r'요\s+역\s*지(?=[가-힣]|\b)', '요역지'),
    (r'요\s+역(?=[가-힣]|\b)', '요역'),
    (r'탄\s+력\s*성(?=[가-힣]|\b)', '탄력성'),
    (r'기\s+울\s*기(?=[가-힣]|\b)', '기울기'),
    (r'수\s+익\s*률(?=[가-힣]|\b)', '수익률'),
    (r'환\s+원\s*율(?=[가-힣]|\b)', '환원율'),
    (r'원\s+리\s*금(?=[가-힣]|\b)', '원리금'),
    (r'연\s+와\s*조(?=[가-힣]|\b)', '연와조'),
    (r'집\s+하\s*장(?=[가-힣]|\b)', '집하장'),
    (r'선\s+매\s*자(?=[가-힣]|\b)', '선매자'),
    (r'관\s+망\s*탑(?=[가-힣]|\b)', '관망탑'),
    (r'배\s+액(?=[가-힣]|\b)', '배액'),
    (r'산\s+식(?=[가-힣]|\b)', '산식'),
    (r'안\s+분(?=[가-힣]|\b)', '안분'),
    (r'타\s+주\s*점\s*유(?=[가-힣]|\b)', '타주점유'),
    (r'타\s+주(?=[가-힣]|\b)', '타주'),
    (r'제\s+척\s*기\s*간(?=[가-힣]|\b)', '제척기간'),
    (r'제\s+척(?=[가-힣]|\b)', '제척'),
    (r'임\s+장\s*활\s*동(?=[가-힣]|\b)', '임장활동'),
    (r'임\s+장(?=[가-힣]|\b)', '임장'),
    (r'견\s+련\s*관\s*계(?=[가-힣]|\b)', '견련관계'),
    (r'견\s+련(?=[가-힣]|\b)', '견련'),
    (r'일\s+물\s*일\s*권(?=[가-힣]|\b)', '일물일권'),
    (r'점\s+증\s*상\s*환(?=[가-힣]|\b)', '점증상환'),
    (r'없\s+더\s*라\s*도', '없더라도'),
    (r'다\s+핵\s*심\s*이\s*론', '다핵심이론'),
    (r'방\s+해\s*배\s*제', '방해배제'),
    (r'신고\s+필\s*증(?=[가-힣]|\b)', '신고필증'),
    (r'등록\s+필\s*증(?=[가-힣]|\b)', '등록필증'),
    (r'등기\s+필\s*증(?=[가-힣]|\b)', '등기필증'),
    (r'지상\s+경계\s*점\s*등록부', '지상경계점등록부'),
    (r'공시\s+지\s*가(?=[가-힣]|\b)', '공시지가'),
    (r'개별\s*공시\s*지\s*가(?=[가-힣]|\b)', '개별공시지가'),
    (r'표준지\s*공시\s*지\s*가(?=[가-힣]|\b)', '표준지공시지가'),
    (r'중개\s+사무소(?=[가-힣]|\b)', '중개사무소'),
]

# Let's test and search
all_matches = []
for pat, repl in replacement_rules:
    regex = re.compile(pat)
    count = 0
    examples = []
    for path, text in texts:
        for m in regex.finditer(text):
            count += 1
            if len(examples) < 3:
                start = max(0, m.start() - 25)
                end = min(len(text), m.end() + 25)
                new_snippet = regex.sub(repl, text[start:end])
                examples.append(f"[{path}]\n  BEFORE: {text[start:end].replace(chr(10), ' ')}\n  AFTER : {new_snippet.replace(chr(10), ' ')}")
    if count > 0:
        all_matches.append({
            'pattern': pat,
            'replacement': repl,
            'count': count,
            'examples': examples
        })

with open('scratch/spacing_audit_detailed.txt', 'w', encoding='utf-8') as f:
    f.write(f"=== SPACING AUDIT: {len(all_matches)} RULES ACTIVE ===\n\n")
    total_occurrences = sum(x['count'] for x in all_matches)
    f.write(f"Total Replacements Found: {total_occurrences}\n\n")
    for item in all_matches:
        f.write(f"Rule: {item['pattern']} -> {item['replacement']} (총 {item['count']}회)\n")
        for ex in item['examples']:
            f.write(f"{ex}\n")
        f.write("\n" + "-"*60 + "\n\n")

print(f"Total replacements found: {total_occurrences}")
