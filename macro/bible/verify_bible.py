import sys
import json
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

bible_path = os.path.join(os.path.dirname(__file__), "bible.json")

with open(bible_path, "r", encoding="utf-8") as f:
    bible = json.load(f)

print(f"Total books loaded: {len(bible)}")

# Key verses to check:
# 1. Genesis 1:1
# 2. Psalm 23:1
# 3. John 3:16
# 4. Romans 8:28
# 5. Revelation 22:21

def get_verse(book_id, chapter, verse):
    for b in bible:
        if b["bookId"] == book_id:
            for ch in b["chapters"]:
                if ch["chapter"] == chapter:
                    for v in ch["verses"]:
                        if v["verse"] == verse:
                            return b["nameKo"], b["nameEn"], v["en"], v["ko"]
    return None

samples = [
    (1, 1, 1),    # Genesis 1:1
    (19, 23, 1),  # Psalm 23:1
    (43, 3, 16),  # John 3:16
    (45, 8, 28),  # Romans 8:28
    (66, 22, 21), # Revelation 22:21
]

print("\n=== 주요 성경 구절 샘플 검증 ===")
for b_id, ch_num, v_num in samples:
    res = get_verse(b_id, ch_num, v_num)
    if res:
        ko_name, en_name, en_txt, ko_txt = res
        print(f"\n📖 {ko_name} ({en_name}) {ch_num}:{v_num}")
        print(f"  [EN] {en_txt}")
        print(f"  [KO] {ko_txt}")

# Check missing English or Korean texts
empty_en = 0
empty_ko = 0
total_verses = 0

for b in bible:
    for ch in b["chapters"]:
        for v in ch["verses"]:
            total_verses += 1
            if not v["en"].strip():
                empty_en += 1
            if not v["ko"].strip():
                empty_ko += 1

print(f"\n=== 전체 무결성 검사 ===")
print(f"총 절 수: {total_verses:,}개")
print(f"영문 누락 수: {empty_en}개")
print(f"한글 누락 수: {empty_ko}개")
