export interface Problem {
  hashtags: string[];
  question: string;
  description: string;
  formulas?: string[];
  formula?: string;
  explanationFormulas?: string[];
  explanationFormula?: string;
  erds?: string[];
  erd?: string;
  explanationErds?: string[];
  explanationErd?: string;
  choices: string[];
  choiceDescriptions?: string[];
  choiceFormulas?: string[][];
  choiceErds?: string[][];
  answer: number;
  answers?: number[];
  isMultipleAnswer?: boolean;
  showMultipleCount?: boolean;
  explanation: string;
  choiceExplanations: string[];
  choiceExplanationDescriptions?: string[];
  choiceExplanationFormulas?: string[][];
  choiceExplanationErds?: string[][];
}

export interface ProblemSetData {
  problems: Problem[];
}

export interface CommonLatexSymbol {
  label: string;
  code: string;
}

export function createEmptyProblem(): Problem {
  return {
    hashtags: [],
    question: '',
    description: '',
    formulas: [],
    explanationFormulas: [],
    erds: [],
    explanationErds: [],
    choices: ['', '', '', ''],
    choiceDescriptions: ['', '', '', ''],
    choiceFormulas: [[], [], [], []],
    choiceErds: [[], [], [], []],
    answer: 0,
    answers: [],
    isMultipleAnswer: false,
    showMultipleCount: true,
    explanation: '',
    choiceExplanations: ['', '', '', ''],
    choiceExplanationDescriptions: ['', '', '', ''],
    choiceExplanationFormulas: [[], [], [], []],
    choiceExplanationErds: [[], [], [], []],
  };
}
