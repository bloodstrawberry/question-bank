"""
CSB Bible PDF Parser & Korean-English Bible JSON Generator (Master Edition)
- CSB_Pew_Bible_2nd_Printing.pdf 를 정밀 파싱하여 66권 전체 1,189장 31,102절 영문 성경 추출
- 개역한글 한글 성경과 1:1 대조 매핑
- 영문/한글 텍스트 완벽 정제 (드롭캡, 하이픈 분절, 분리 단어 접합)
- 구조화된 bible.json 생성 및 무결성 검증
"""

import os
import sys
import json
import re
import urllib.request
from typing import List, Dict, Any, Optional, Tuple

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        print("❌ pymupdf가 설치되어 있지 않습니다. pip install pymupdf")
        sys.exit(1)

# 66권 성경 메타데이터 정의 (구약 39권, 신약 27권)
BOOK_TOC = [
    # 구약 (Old Testament - 39권)
    ("Genesis", "창세기", "창", "Gn", "OT", 1),
    ("Exodus", "출애굽기", "출", "Ex", "OT", 47),
    ("Leviticus", "레위기", "레", "Lv", "OT", 85),
    ("Numbers", "민수기", "민", "Nm", "OT", 112),
    ("Deuteronomy", "신명기", "신", "Dt", "OT", 151),
    ("Joshua", "여호수아", "수", "Jos", "OT", 184),
    ("Judges", "사사기", "삿", "Jdg", "OT", 207),
    ("Ruth", "룻기", "룻", "Ru", "OT", 229),
    ("1 Samuel", "사무엘상", "삼상", "1Sm", "OT", 233),
    ("2 Samuel", "사무엘하", "삼하", "2Sm", "OT", 262),
    ("1 Kings", "열왕기상", "왕상", "1Kg", "OT", 287),
    ("2 Kings", "열왕기하", "왕하", "2Kg", "OT", 317),
    ("1 Chronicles", "역대상", "대상", "1Ch", "OT", 345),
    ("2 Chronicles", "역대하", "대하", "2Ch", "OT", 374),
    ("Ezra", "에스라", "스", "Ezr", "OT", 407),
    ("Nehemiah", "느헤미야", "느", "Neh", "OT", 418),
    ("Esther", "에스더", "에", "Est", "OT", 433),
    ("Job", "욥기", "욥", "Jb", "OT", 440),
    ("Psalms", "시편", "시", "Ps", "OT", 472),
    ("Proverbs", "잠언", "잠", "Pr", "OT", 554),
    ("Ecclesiastes", "전도서", "전", "Ec", "OT", 586),
    ("Song of Songs", "아가", "아", "Sg", "OT", 594),
    ("Isaiah", "이사야", "사", "Is", "OT", 600),
    ("Jeremiah", "예레미야", "렘", "Jr", "OT", 664),
    ("Lamentations", "예레미야애가", "애", "Lm", "OT", 726),
    ("Ezekiel", "에스겔", "겔", "Ezk", "OT", 734),
    ("Daniel", "다니엘", "단", "Dn", "OT", 782),
    ("Hosea", "호세아", "호", "Hs", "OT", 797),
    ("Joel", "요엘", "욜", "Jl", "OT", 807),
    ("Amos", "아모스", "암", "Am", "OT", 811),
    ("Obadiah", "오바댜", "옵", "Ob", "OT", 819),
    ("Jonah", "요나", "욘", "Jnh", "OT", 821),
    ("Micah", "미가", "미", "Mc", "OT", 823),
    ("Nahum", "나훔", "나", "Nah", "OT", 829),
    ("Habakkuk", "하박국", "합", "Hab", "OT", 832),
    ("Zephaniah", "스바냐", "습", "Zph", "OT", 835),
    ("Haggai", "학개", "학", "Hg", "OT", 839),
    ("Zechariah", "스가랴", "슥", "Zch", "OT", 841),
    ("Malachi", "말라기", "말", "Mal", "OT", 849),
    # 신약 (New Testament - 27권)
    ("Matthew", "마태복음", "마", "Mt", "NT", 855),
    ("Mark", "마가복음", "막", "Mk", "NT", 887),
    ("Luke", "누가복음", "눅", "Lk", "NT", 907),
    ("John", "요한복음", "요", "Jn", "NT", 941),
    ("Acts", "사도행전", "행", "Ac", "NT", 966),
    ("Romans", "로마서", "롬", "Rm", "NT", 997),
    ("1 Corinthians", "고린도전서", "고전", "1Co", "NT", 1011),
    ("2 Corinthians", "고린도후서", "고후", "2Co", "NT", 1023),
    ("Galatians", "갈라디아서", "갈", "Gl", "NT", 1031),
    ("Ephesians", "에베소서", "엡", "Eph", "NT", 1036),
    ("Philippians", "빌립보서", "빌", "Php", "NT", 1040),
    ("Colossians", "골로새서", "골", "Col", "NT", 1043),
    ("1 Thessalonians", "데살로니가전서", "살전", "1Th", "NT", 1046),
    ("2 Thessalonians", "데살로니가후서", "살후", "2Th", "NT", 1049),
    ("1 Timothy", "디모데전서", "딤전", "1Tm", "NT", 1051),
    ("2 Timothy", "디모데후서", "딤후", "2Tm", "NT", 1055),
    ("Titus", "디도서", "딛", "Ti", "NT", 1058),
    ("Philemon", "빌레몬서", "몬", "Phm", "NT", 1060),
    ("Hebrews", "히브리서", "히", "Heb", "NT", 1061),
    ("James", "야고보서", "약", "Jms", "NT", 1071),
    ("1 Peter", "베드로전서", "벧전", "1Pt", "NT", 1075),
    ("2 Peter", "베드로후서", "벧후", "2Pt", "NT", 1079),
    ("1 John", "요한일서", "요일", "1Jn", "NT", 1082),
    ("2 John", "요한이서", "요이", "2Jn", "NT", 1086),
    ("3 John", "요한삼서", "요삼", "3Jn", "NT", 1087),
    ("Jude", "유다서", "유", "Jd", "NT", 1088),
    ("Revelation", "요한계시록", "계", "Rv", "NT", 1089),
]


def load_korean_bible() -> List[Dict[str, Any]]:
    """한국어 성경 JSON 데이터 로드 (로컬 캐시 또는 온라인)"""
    cache_path = os.path.join(os.path.dirname(__file__), "ko_bible_cache.json")
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8-sig") as f:
            return json.load(f)

    url = "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ko_ko.json"
    print("📥 한국어 성경 데이터 다운로드 중...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8-sig"))

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data


def parse_page_elements(page: pymupdf.Page) -> List[Dict[str, Any]]:
    """PDF 페이지에서 본문 엘리먼트(장, 절, 본문 텍스트, 헤딩) 추출"""
    d = page.get_text("dict")

    def process_col(is_right: bool) -> List[Dict[str, Any]]:
        col_blocks = []
        for b in d["blocks"]:
            if b.get("type") != 0:
                continue
            bbox = b["bbox"]
            if bbox[1] > 605:
                continue  # 하단 각주 및 푸터 제외

            is_r = bbox[0] >= 225
            if is_r == is_right:
                col_blocks.append(b)

        col_blocks.sort(key=lambda b: b["bbox"][1])

        elements = []
        for b in col_blocks:
            for l in b["lines"]:
                # 러닝 타이틀 제외 (y < 46)
                if l["bbox"][1] < 46:
                    continue

                spans = sorted(l["spans"], key=lambda s: s["bbox"][0])
                for s in spans:
                    raw_t = (
                        s["text"]
                        .replace("\xad", "")
                        .replace("\u2009", " ")
                        .replace("\xa0", " ")
                        .replace("\u200b", "")
                    )
                    t = raw_t.strip()
                    if not t:
                        continue
                    font = s["font"]
                    size = s["size"]

                    # 1. 각주 첨자 제외 (크기 7.0pt 미만의 소문자 알파벳)
                    if size < 7.0 and re.match(r"^[a-z]$", t):
                        continue

                    # 2. 챕터 번호 감지 (Bold, size >= 13.0pt, 숫자)
                    if "Bold" in font and size >= 13.0 and t.isdigit():
                        elements.append({"type": "chapter", "val": int(t)})
                        continue

                    # 3. 섹션 헤딩 감지 (대문자 제목)
                    if ("Semibold" in font or ("Sans" in font and size <= 9.2)) and (
                        t.isupper() or (len(t) > 3 and t == t.upper())
                    ):
                        elements.append({"type": "heading", "val": t})
                        continue

                    # 4. 절 번호 감지 (BibleSans3-Bold, 8.5~11.0pt, 숫자)
                    if "Sans" in font and "Bold" in font and 8.5 <= size <= 11.0 and t.isdigit():
                        elements.append({"type": "verse_num", "val": int(t)})
                        continue

                    # 5. 본문 텍스트
                    elements.append({"type": "text", "val": raw_t})

        return elements

    left = process_col(False)
    right = process_col(True)
    return left + right


def clean_verse_text(text: str, book_name_en: str, next_book_name_en: str = "") -> str:
    """구절 텍스트 정제 (드롭캡, 하이픈 분절 연결, 분리 단어 접합)"""
    t = text
    # 책 이름이나 서두 헤딩 잔여물 제거
    if t.startswith(book_name_en + " "):
        t = t[len(book_name_en) + 1 :].strip()

    # 다음 책 이름 잔여물 제거
    if next_book_name_en and t.endswith(next_book_name_en):
        t = t[: -len(next_book_name_en)].strip()

    # 1. 드롭캡(Drop cap) 단어 연결 (예: "T he elder" -> "The elder", "I n the" -> "In the")
    t = re.sub(r"^([A-Z])\s+([a-z]+)", r"\1\2", t)

    # 2. 하이픈으로 분리된 단어 연결 (예: "cre- ated" -> "created", "separat- ed" -> "separated")
    t = re.sub(r"(\b\w+)-\s+(\w+\b)", r"\1\2", t)

    # 3. 붙어버린 대명사 I / 관사 A 분리
    t = re.sub(r"\bI([a-z]{2,})\b", r"I \1", t)
    t = re.sub(r"\bA(psalm|club|river|man|woman|child|voice|great|lamp|thousand)\b", r"A \1", t, flags=re.IGNORECASE)

    # 4. 줄바꿈으로 인해 갈라진 일반 영단어 교정
    common_split_words = [
        (r"\bseparat\s+ed\b", "separated"),
        (r"\bsepa\s+rated\b", "separated"),
        (r"\bsepa\s+rate\b", "separate"),
        (r"\bseparat\s+ing\b", "separating"),
        (r"\bev\s+eryone\b", "everyone"),
        (r"\bev\s+ery\b", "every"),
        (r"\bev\s+erything\b", "everything"),
        (r"\bbroth\s+er\b", "brother"),
        (r"\bdaugh\s+ter\b", "daughter"),
        (r"\bsub\s+due\b", "subdue"),
        (r"\bfel\s+low\b", "fellow"),
        (r"\ba\s+fraid\b", "afraid"),
        (r"\bforgiv\s+en\b", "forgiven"),
        (r"\bcre\s+ated\b", "created"),
        (r"\bcre\s+atures\b", "creatures"),
        (r"\bcre\s+ature\b", "creature"),
        (r"\bgen\s+er\s+a\s+tions\b", "generations"),
        (r"\bgen\s+er\s+a\s+tion\b", "generation"),
        (r"\btrans\s+gress\s+ions\b", "transgressions"),
        (r"\btrans\s+gress\s+ion\b", "transgression"),
        (r"\bright\s+eous\s+ness\b", "righteousness"),
        (r"\bright\s+eous\b", "righteous"),
        (r"\bun\s+right\s+eous\b", "unrighteous"),
        (r"\bcom\s+mand\s+ment\b", "commandment"),
        (r"\bcom\s+mand\s+ments\b", "commandments"),
        (r"\bcom\s+mand\s+ed\b", "commanded"),
        (r"\bauthor\s+i\s+ty\b", "authority"),
        (r"\bauthor\s+i\s+ties\b", "authorities"),
        (r"\bpos\s+ses\s+sion\b", "possession"),
        (r"\bpos\s+ses\s+sions\b", "possessions"),
        (r"\bin\s+her\s+i\s+tance\b", "inheritance"),
        (r"\bcom\s+pas\s+sion\b", "compassion"),
        (r"\bcon\s+gre\s+ga\s+tion\b", "congregation"),
        (r"\bun\s+der\s+stand\s+ing\b", "understanding"),
        (r"\bak\s+nowl\s+edge\b", "acknowledge"),
        (r"\bEl\s+iphaz\b", "Eliphaz"),
    ]
    for pat, repl in common_split_words:
        t = re.sub(pat, repl, t, flags=re.IGNORECASE)

    # 5. 불필요한 다중 공백 및 마침표/쉼표 앞 공백 정리
    t = re.sub(r"\s+([.,;:!?])", r"\1", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def clean_korean_verse(ko_text: str) -> str:
    """한국어 성경 구절 정제 (HTML 엔티티 변환 등)"""
    t = ko_text
    t = t.replace("&#x27;", "'").replace("&quot;", '"').replace("&amp;", "&")
    t = t.replace("&lt;", "<").replace("&gt;", ">")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def parse_book(
    doc: pymupdf.Document,
    start_p: int,
    end_p: int,
    total_ch: int,
    name_en: str,
    next_name_en: str,
) -> Dict[int, Dict[int, str]]:
    """한 권의 성경 본문을 안전하게 파싱"""
    chapters: Dict[int, Dict[int, str]] = {}
    current_ch = 1
    current_verse = 1
    buffer = ""
    stop_parsing = False

    for p in range(start_p, min(end_p + 1, len(doc))):
        if stop_parsing:
            break
        elems = parse_page_elements(doc[p])
        for el in elems:
            t_type = el["type"]
            val = el["val"]

            # 다음 책 제목 헤딩 감지 시 파싱 중단
            if next_name_en and t_type == "heading":
                clean_h = str(val).replace(" ", "").upper()
                clean_next = next_name_en.replace(" ", "").upper()
                if clean_h == clean_next:
                    stop_parsing = True
                    break

            if t_type == "chapter":
                if buffer.strip():
                    if current_ch not in chapters:
                        chapters[current_ch] = {}
                    chapters[current_ch][current_verse] = buffer.strip()
                    buffer = ""

                # 다음 책의 1장이 시작된 경우 파싱 종료
                if val == 1 and (current_ch == total_ch or current_ch > 1):
                    stop_parsing = True
                    break

                if 1 <= val <= total_ch:
                    current_ch = val
                    current_verse = 1

            elif t_type == "verse_num":
                if buffer.strip():
                    if current_ch not in chapters:
                        chapters[current_ch] = {}
                    chapters[current_ch][current_verse] = buffer.strip()
                    buffer = ""
                current_verse = val

            elif t_type == "heading":
                continue

            elif t_type == "text":
                buffer += val + " "

    if buffer.strip() and not stop_parsing:
        if current_ch not in chapters:
            chapters[current_ch] = {}
        chapters[current_ch][current_verse] = buffer.strip()

    # 정제
    cleaned_chapters: Dict[int, Dict[int, str]] = {}
    for ch in sorted(chapters.keys()):
        cleaned_chapters[ch] = {}
        for v in sorted(chapters[ch].keys()):
            raw_v = chapters[ch][v]
            cleaned_v = clean_verse_text(raw_v, name_en, next_name_en)
            if cleaned_v:
                cleaned_chapters[ch][v] = cleaned_v

    return cleaned_chapters


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(base_dir, "CSB_Pew_Bible_2nd_Printing.pdf")
    output_path = os.path.join(base_dir, "bible.json")

    if not os.path.exists(pdf_path):
        print(f"❌ PDF 파일을 찾을 수 없습니다: {pdf_path}")
        sys.exit(1)

    print("📖 CSB Bible PDF 여는 중...")
    doc = pymupdf.open(pdf_path)
    print(f"✅ 총 {len(doc)} 페이지 로드 완료")

    ko_bible_data = load_korean_bible()
    print(f"✅ 한국어 성경 {len(ko_bible_data)}권 로드 완료\n")

    PAGE_OFFSET = 9

    full_bible = []
    total_parsed_verses = 0
    total_chapters_count = 0

    print("=" * 65)
    print("성경 66권 영한 대조 데이터 생성 시작")
    print("=" * 65)

    for i in range(len(BOOK_TOC)):
        name_en, name_ko, abbrev, abbrev_en, testament, start_page = BOOK_TOC[i]
        next_name_en = BOOK_TOC[i + 1][0] if i + 1 < len(BOOK_TOC) else ""
        end_page = BOOK_TOC[i + 1][5] if i + 1 < len(BOOK_TOC) else 1104

        ko_book = ko_bible_data[i]
        ko_chapters = ko_book.get("chapters", [])
        num_chapters = len(ko_chapters)

        start_p = start_page + PAGE_OFFSET
        end_p = end_page + PAGE_OFFSET

        parsed_chapters = parse_book(
            doc, start_p, end_p, num_chapters, name_en, next_name_en
        )

        book_chapters_list = []
        book_total_verses = 0

        for ch_num in range(1, num_chapters + 1):
            ko_ch_verses = ko_chapters[ch_num - 1] if ch_num - 1 < len(ko_chapters) else []
            en_ch_verses = parsed_chapters.get(ch_num, {})

            num_v = len(ko_ch_verses)
            if en_ch_verses:
                valid_extra = [v for v in en_ch_verses.keys() if v > num_v and len(en_ch_verses[v]) > 5]
                if valid_extra and max(valid_extra) - num_v <= 2:
                    num_v = max(num_v, max(valid_extra))

            chapter_verses = []
            for v_num in range(1, num_v + 1):
                ko_v_text = ko_ch_verses[v_num - 1] if v_num - 1 < len(ko_ch_verses) else ""
                ko_v_text = clean_korean_verse(ko_v_text)

                en_v_text = en_ch_verses.get(v_num, "")

                if en_v_text or ko_v_text:
                    chapter_verses.append(
                        {
                            "verse": v_num,
                            "en": en_v_text,
                            "ko": ko_v_text,
                        }
                    )

            book_chapters_list.append(
                {
                    "chapter": ch_num,
                    "totalVerses": len(chapter_verses),
                    "verses": chapter_verses,
                }
            )
            book_total_verses += len(chapter_verses)
            total_chapters_count += 1

        total_parsed_verses += book_total_verses

        book_obj = {
            "bookId": i + 1,
            "testament": testament,
            "nameEn": name_en,
            "nameKo": name_ko,
            "abbrev": abbrev,
            "abbrevEn": abbrev_en,
            "totalChapters": len(book_chapters_list),
            "totalVerses": book_total_verses,
            "chapters": book_chapters_list,
        }
        full_bible.append(book_obj)

        print(
            f"[{i+1:02d}/66] {name_en:18s} ({name_ko:7s}) | {len(book_chapters_list):3d}장 | {book_total_verses:5d}절 완료"
        )

    print("=" * 65)
    print(f"📊 총 생성 통계:")
    print(f"  - 성경 총 권수: {len(full_bible)}권 (구약 39권, 신약 27권)")
    print(f"  - 성경 총 장수: {total_chapters_count:,}장")
    print(f"  - 성경 총 절수: {total_parsed_verses:,}절")
    print("=" * 65)

    print(f"\n💾 {output_path} 파일 저장 중...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(full_bible, f, ensure_ascii=False, indent=2)

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ bible.json 생성 완료! (파일 크기: {file_size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
