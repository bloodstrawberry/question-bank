import type { CommonLatexSymbol } from './types';

export interface ERDTemplate {
  label: string;
  code: string;
}

export const COMMON_ERD_TEMPLATES: ERDTemplate[] = [
  {
    label: '1:N 관계 (일대다)',
    code: 'CUSTOMER ||--o{ ORDER : "places"',
  },
  {
    label: 'N:M 관계 (다대다)',
    code: 'STUDENT }|--|{ COURSE : "enrolls"',
  },
  {
    label: '엔티티 & 속성 정의',
    code: `USER {\n    int id PK\n    string email UK\n    string name\n    datetime created_at\n}`,
  },
  {
    label: '식별 관계 (1:1)',
    code: 'PERSON ||--|| PASSPORT : "has"',
  },
  {
    label: '비식별 관계 (0/1:N)',
    code: 'DEPARTMENT ||..o{ EMPLOYEE : "employs"',
  },
];

export const COMMON_LATEX_SYMBOLS: CommonLatexSymbol[] = [
  { label: '분수', code: '\\frac{a}{b}' },
  { label: '지수', code: 'x^{n}' },
  { label: '아래첨자', code: 'x_{n}' },
  { label: '제곱근', code: '\\sqrt{x}' },
  { label: 'n제곱근', code: '\\sqrt[n]{x}' },
  { label: '합 (∑)', code: '\\sum_{i=1}^{n}' },
  { label: '적분 (∫)', code: '\\int_{a}^{b}' },
  { label: '±', code: '\\pm' },
  { label: '×', code: '\\times' },
  { label: '÷', code: '\\div' },
  { label: '≠', code: '\\neq' },
  { label: '≤', code: '\\le' },
  { label: '≥', code: '\\ge' },
  { label: 'α', code: '\\alpha' },
  { label: 'β', code: '\\beta' },
  { label: 'θ', code: '\\theta' },
  { label: 'π', code: '\\pi' },
  { label: '∞', code: '\\infty' },
];

export interface ChartTemplate {
  label: string;
  code: string;
}

export const COMMON_CHART_TEMPLATES: ChartTemplate[] = [
  {
    label: '막대 그래프 (Bar)',
    code: `{\n  "data": [\n    {\n      "x": ["항목 A", "항목 B", "항목 C", "항목 D"],\n      "y": [25, 40, 15, 60],\n      "type": "bar",\n      "marker": { "color": "#1877F2" }\n    }\n  ],\n  "layout": { "title": "항목별 데이터 비교", "height": 300 }\n}`,
  },
  {
    label: '꺾은선 그래프 (Line)',
    code: `{\n  "data": [\n    {\n      "x": ["1분기", "2분기", "3분기", "4분기"],\n      "y": [120, 190, 300, 500],\n      "type": "scatter",\n      "mode": "lines+markers",\n      "line": { "color": "#00A76F", "width": 3 }\n    }\n  ],\n  "layout": { "title": "분기별 추이", "height": 300 }\n}`,
  },
  {
    label: '원형 차트 (Pie)',
    code: `{\n  "data": [\n    {\n      "labels": ["수학", "영어", "국어", "과학"],\n      "values": [35, 25, 20, 20],\n      "type": "pie",\n      "hole": 0.3\n    }\n  ],\n  "layout": { "title": "과목별 비율", "height": 300 }\n}`,
  },
  {
    label: '산점도 (Scatter)',
    code: `{\n  "data": [\n    {\n      "x": [1, 2, 3, 4, 5, 6, 7],\n      "y": [3, 5, 4, 8, 7, 11, 10],\n      "mode": "markers",\n      "type": "scatter",\n      "marker": { "size": 10, "color": "#8E33FF" }\n    }\n  ],\n  "layout": { "title": "상관관계 산점도", "height": 300 }\n}`,
  },
  {
    label: '방사형 (Radar)',
    code: `{\n  "data": [\n    {\n      "type": "scatterpolar",\n      "r": [80, 90, 70, 85, 60, 80],\n      "theta": ["이해력", "논리력", "계산력", "창의력", "집중력", "이해력"],\n      "fill": "toself",\n      "name": "역량 평가"\n    }\n  ],\n  "layout": {\n    "polar": {\n      "radialaxis": { "visible": true, "range": [0, 100] }\n    },\n    "title": "역량 분석 레이더",\n    "height": 320\n  }\n}`,
  },
  {
    label: 'Mermaid 파이',
    code: `pie title 선호도 조사\n  "A 옵션" : 45\n  "B 옵션" : 30\n  "C 옵션" : 25`,
  },
  {
    label: 'Mermaid XY차트',
    code: `xychart-beta\n  title "월별 판매 추이"\n  x-axis ["1월", "2월", "3월", "4월", "5월"]\n  y-axis "판매량 (개)" 0 --> 100\n  bar [30, 45, 60, 80, 95]\n  line [30, 45, 60, 80, 95]`,
  },
];
