---
trigger: always_on
---

Layout Architecture: Full-Screen Viewport & Internal Scrolling
본 프로젝트의 UI 레이아웃은 웹 페이지가 아닌 단일 앱(App-like Application)처럼 동작하도록 구성합니다. 전체 브라우저 창의 스크롤은 차단하며, 콘텐츠가 넘칠 경우 화면 전체가 아닌 해당 컴포넌트 내부에서만 스크롤이 발생해야 합니다.

1. 기본 원칙 (Core Rules)
전체 화면 높이 고정: 루트 및 최상위 레이아웃은 브라우저 뷰포트(Viewport) 높이를 초과하지 않습니다. (100vh 또는 100dvh 제한)

글로벌 스크롤 방지: 바디(<body>)나 전체 페이지 레이아웃 크기가 커져서 브라우저 우측에 스크롤바가 생기는 것을 금지합니다.

내부 스크롤 제어: 데이터가 많아 화면을 벗어나는 컴포넌트(예: 리스트, 사이드바, 메인 본문)는 독립적인 높이를 가지고 그 내부에서만 스크롤(overflow-y: auto)이 작동해야 합니다.