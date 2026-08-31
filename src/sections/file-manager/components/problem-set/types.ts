export interface ConceptLink {
  id: string;
  title: string;
  fileId?: string;
  fileName?: string;
}

export interface Problem {
  hashtags: string[];
  question: string;
  description: string;
  conceptLinks?: ConceptLink[];
  formulas?: string[];
  formula?: string;
  explanationFormulas?: string[];
  explanationFormula?: string;
  erds?: string[];
  erd?: string;
  explanationErds?: string[];
  explanationErd?: string;
  charts?: string[];
  chart?: string;
  explanationCharts?: string[];
  explanationChart?: string;
  choices: string[];
  choiceDescriptions?: string[];
  choiceFormulas?: string[][];
  choiceErds?: string[][];
  choiceCharts?: string[][];
  answer: number;
  answers?: number[];
  isMultipleAnswer?: boolean;
  showMultipleCount?: boolean;
  disableChoiceShuffle?: boolean;
  explanation: string;
  choiceExplanations: string[];
  choiceExplanationDescriptions?: string[];
  choiceExplanationFormulas?: string[][];
  choiceExplanationErds?: string[][];
  choiceExplanationCharts?: string[][];
  isLlmMatch?: boolean;
  isLlmMath?: boolean;
  isLlmProcessed?: boolean;
  llmPredictedAnswer?: number;
  llmKeyConcept?: string;
}

export interface ProblemSetData {
  problems: Problem[];
}

export interface CommonLatexSymbol {
  label: string;
  code: string;
}

export function createEmptyProblem(choicesCount: number = 4): Problem {
  const count = Math.max(2, choicesCount);
  return {
    hashtags: [],
    question: '',
    description: '',
    conceptLinks: [],
    formulas: [],
    explanationFormulas: [],
    erds: [],
    explanationErds: [],
    charts: [],
    explanationCharts: [],
    choices: Array(count).fill(''),
    choiceDescriptions: Array(count).fill(''),
    choiceFormulas: Array.from({ length: count }, () => []),
    choiceErds: Array.from({ length: count }, () => []),
    choiceCharts: Array.from({ length: count }, () => []),
    answer: 0,
    answers: [],
    isMultipleAnswer: false,
    showMultipleCount: true,
    disableChoiceShuffle: false,
    explanation: '',
    choiceExplanations: Array(count).fill(''),
    choiceExplanationDescriptions: Array(count).fill(''),
    choiceExplanationFormulas: Array.from({ length: count }, () => []),
    choiceExplanationErds: Array.from({ length: count }, () => []),
    choiceExplanationCharts: Array.from({ length: count }, () => []),
  };
}
