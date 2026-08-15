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
