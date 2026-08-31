import json
import re

with open('src/api/dummy/default.json', 'r', encoding='utf-8') as f:
    raw_json = f.read()

additional_replacements = [
    (r'송\s+수\s+관(?=[가-힣]|\b|[ㆍ\u30fb,.\s])', '송수관'),
    (r'후\s+분\s*양(?=[가-힣]|\b)', '후분양'),
    (r'원\s+금(?=\s*균등|\s*상환)', '원금'),
    (r'그\s+것(?=[가-힣]|\b)', '그것'),
    (r'산\s+지\s*일\s*시\s*사용', '산지일시사용'),
    (r'급\s+유\s*\(給油\)', '급유(給油)'),
    (r'그\s+조\s*건(?=[가-힣]|\b)', '그 조건'),
    (r'그\s+건\s*물(?=[가-힣]|\b)', '그 건물'),
    (r'그\s+토\s*지(?=[가-힣]|\b)', '그 토지'),
    (r'까\s+지\s*할', '까지 할'),
]

processed_json = raw_json
total_changes = 0
for pat, repl in additional_replacements:
    regex = re.compile(pat)
    matches = regex.findall(processed_json)
    if matches:
        processed_json, count = regex.subn(repl, processed_json)
        total_changes += count

try:
    parsed = json.loads(processed_json)
    with open('src/api/dummy/default.json', 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    print(f"JSON is valid. Successfully applied {total_changes} additional fixes!")
except Exception as e:
    print(f"Error: {e}")
