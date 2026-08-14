import type { CommonLatexSymbol } from './types';

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
