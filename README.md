# Question Bank

문제 모음집을 관리하는 웹 애플리케이션입니다. 객관식 문제를 파일 단위로 만들고, 풀어보고, 해설을 확인할 수 있습니다.

## 주요 기능

### 파일 관리 (File Manager)
- 폴더/파일 트리 구조로 문제 모음집을 관리
- 드래그 앤 드롭으로 파일/폴더 이동
- 파일 복사, 이름 변경, 삭제
- JSON 백업/복원 기능

### 문제 편집 (Problem Set Editor)
- `problem-set-editor-view.tsx`
- 하나의 파일에 여러 문제를 등록 가능
- 각 문제는 아래 항목으로 구성:
  | 항목 | 설명 |
  |---|---|
  | 해시태그 | `#11회 실기`, `#모의고사` 등 분류 태그 |
  | 문제 | 문제 본문 텍스트 |
  | 문제 추가 설명 | 보충 설명 (textarea) |
  | 객관식 1~5 | 5지선다 선택지 |
  | 정답 번호 | 1~5 중 정답 |
  | 해설 | 정답 해설 (textarea) |
  | 객관식별 설명 1~5 | 각 선택지에 대한 설명 |

### 문제 풀기 (Problem Set View)
- `problem-set-view.tsx`
- 해시태그, 문제, 추가 설명, 객관식만 표시 (정답 숨김)
- 두 가지 정답 확인 방식:
  1. **객관식 선택 후 제출** → 정답이면 ✅, 오답이면 ❌ 표시 후 정답 정보 공개
  2. **정답 보기 버튼** → 정답 번호, 해설, 객관식별 설명 공개

## 데이터 구조

모든 데이터는 **IndexedDB**에 저장됩니다. (`src/api/indexDB.ts`)

### Tree 구조 (파일/폴더)
```json
{
  "tree": [
    {
      "id": "1",
      "label": "폴더명",
      "type": "folder",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "modifiedAt": "2025-01-01T00:00:00.000Z",
      "children": [
        {
          "id": "2",
          "label": "파일명",
          "type": "file",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "modifiedAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "scripts": {
    "파일ID": {
      "problems": [...]
    }
  }
}
```

### 문제 데이터 (scripts[fileId])
```typescript
interface ProblemSetData {
  problems: Problem[];
}

interface Problem {
  hashtags: string[];           // ['#11회 실기', '#모의고사']
  question: string;             // 문제 본문
  description: string;          // 문제 추가 설명
  choices: string[];            // ['선택지1', '선택지2', '선택지3', '선택지4', '선택지5']
  answer: number;               // 정답 번호 (1~5)
  explanation: string;          // 해설
  choiceExplanations: string[]; // ['1번 설명', '2번 설명', '3번 설명', '4번 설명', '5번 설명']
}
```

## 키보드 단축키

| 단축키 | 기능 |
|---|---|
| `Ctrl + S` | 문제 저장 (편집기) |
| `Ctrl + E` | 편집 모드 전환 (뷰어) |

## 기술 스택

- **Framework**: Next.js (App Router)
- **UI**: MUI (Material-UI)
- **Storage**: IndexedDB (브라우저 로컬)
- **Language**: TypeScript
