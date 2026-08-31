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

# Let's define specific replacement rules and verify each one
# 1. Economic / Goods terms:
#    정상 재 -> 정상재, 대체 재 -> 대체재, 보완 재 -> 보완재, 열등 재 -> 열등재, 우등 재 -> 우등재, 독립 재 -> 독립재
#    공공 재 -> 공공재, 소비 재 -> 소비재, 생산 재 -> 생산재, 중간 재 -> 중간재, 투자 재 -> 투자재, 기펜 재 -> 기펜재, 사치 재 -> 사치재, 필수 재 -> 필수재
# 2. Math / Stats terms:
#    절 댓 값 -> 절댓값, 절 댓값 -> 절댓값, 절댓 값 -> 절댓값, 절 댓 -> 절댓
# 3. Real Estate / Legal Terms:
#    포 락 지 -> 포락지, 포 락 -> 포락
#    이 행 지 -> 이행지
#    후 보 지 -> 후보지
#    표준 지 -> 표준지
#    경계 점 -> 경계점
#    도 곽 선 -> 도곽선
#    송 수 관 -> 송수관
#    송유 관 -> 송유관
#    담보 부 -> 담보부
#    임대 부 -> 임대부
#    분 사무소 -> 분사무소
#    복 대리 -> 복대리
#    짝 지어 -> 짝지어, 짝 지어진 -> 짝지어진, 짝 지은 -> 짝지은, 짝 짓 -> 짝짓
#    시 산 가액 -> 시산가액, 시 산 가액을 -> 시산가액을, 시 산 가격 -> 시산가격, 시 산 임료 -> 시산임료, 시 산가액 -> 시산가액, 시 산가격 -> 시산가격
#    감 채 기금 -> 감채기금, 감 채기금 -> 감채기금, 감 채 -> 감채
#    승 역 지 -> 승역지, 승 역 -> 승역
#    요 역 지 -> 요역지, 요 역 -> 요역
#    입 목 -> 입목 (단, '한 입 목' 등 앞뒤 문맥 확인)
#    배 액 -> 배액 (계약금의 배 액 -> 배액)
#    안 분 -> 안분
#    산 식 -> 산식
#    환 원 율 -> 환원율
#    수 익 률 -> 수익률
#    탄 력 성 -> 탄력성

# Let's search for all candidates in the texts to see what exists in default.json
rules = [
    # ~재
    (r'정상\s+재\b', '정상재'),
    (r'대체\s+재\b', '대체재'),
    (r'보완\s+재\b', '보완재'),
    (r'열등\s+재\b', '열등재'),
    (r'우등\s+재\b', '우등재'),
    (r'독립\s+재\b', '독립재'),
    (r'공공\s+재\b', '공공재'),
    (r'소비\s+재\b', '소비재'),
    (r'생산\s+재\b', '생산재'),
    (r'중간\s+재\b', '중간재'),
    (r'투자\s+재\b', '투자재'),
    (r'기펜\s+재\b', '기펜재'),
    (r'사치\s+재\b', '사치재'),
    (r'필수\s+재\b', '필수재'),

    # 절댓값
    (r'절\s*댓\s*값', '절댓값'),
    (r'절\s+댓\b', '절댓'),

    # 짝지어
    (r'짝\s+지어', '짝지어'),
    (r'짝\s+지은', '짝지은'),
    (r'짝\s+짓', '짝짓'),

    # 부동산/공인중개사용어
    (r'포\s+락\s+지\b', '포락지'),
    (r'포\s+락\b', '포락'),
    (r'이\s+행\s+지\b', '이행지'),
    (r'후\s+보\s+지\b', '후보지'),
    (r'표준\s+지\b', '표준지'),
    (r'경계\s+점\b', '경계점'),
    (r'도\s+곽\s+선\b', '도곽선'),
    (r'송\s+수\s+관\b', '송수관'),
    (r'송유\s+관\b', '송유관'),
    (r'담보\s+부\b', '담보부'),
    (r'임대\s+부\b', '임대부'),
    (r'분\s+사무소\b', '분사무소'),
    (r'복\s+대리\b', '복대리'),
    (r'시\s+산\s*가\s*액', '시산가액'),
    (r'시\s+산\s*가\s*격', '시산가격'),
    (r'시\s+산\s*임\s*료', '시산임료'),
    (r'시\s+산\b', '시산'),
    (r'감\s+채\s*기\s*금', '감채기금'),
    (r'감\s+채\b', '감채'),
    (r'승\s+역\s*지\b', '승역지'),
    (r'승\s+역\b', '승역'),
    (r'요\s+역\s*지\b', '요역지'),
    (r'요\s+역\b', '요역'),
    (r'배\s+액\b', '배액'),
    (r'산\s+식\b', '산식'),
    (r'안\s+분\b', '안분'),
    (r'환\s+원\s*율\b', '환원율'),
    (r'수\s+익\s*률\b', '수익률'),
    (r'탄\s+력\s*성\b', '탄력성'),
]

report = []
for pat, repl in rules:
    total_matches = 0
    examples = []
    for path, text in texts:
        for m in re.finditer(pat, text):
            total_matches += 1
            if len(examples) < 3:
                start = max(0, m.start() - 25)
                end = min(len(text), m.end() + 25)
                examples.append(f"[{path}] ...{text[start:end].replace(chr(10), ' ')}...")
    if total_matches > 0:
        report.append({
            'pattern': pat,
            'replacement': repl,
            'count': total_matches,
            'examples': examples
        })

with open('scratch/spacing_replacement_preview.txt', 'w', encoding='utf-8') as f:
    f.write(f"=== IDENTIFIED SPACING RULES ({len(report)} rules matched) ===\n\n")
    for item in report:
        f.write(f"규칙: {item['pattern']} -> '{item['replacement']}' (총 {item['count']}회 발견)\n")
        for ex in item['examples']:
            f.write(f"   예시: {ex}\n")
        f.write("\n")

print(f"Preview written. Total active rules: {len(report)}")
