import type { Problem, ProblemSetData } from './types';

import { arrayMove } from '@dnd-kit/sortable';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { getFileScript, saveFileScript } from 'src/api/indexDB';

import { toast } from 'src/components/snackbar';

import { createEmptyProblem } from './types';

interface UseProblemSetEditorOptions {
  fileId: string;
  initialProblemIndex?: number;
  onSaveSuccess?: (problemIndex?: number) => void;
  onSave?: (fileId: string) => void;
}

export function useProblemSetEditor({
  fileId,
  initialProblemIndex = 0,
  onSaveSuccess,
  onSave,
}: UseProblemSetEditorOptions) {
  const [data, setData] = useState<ProblemSetData>({ problems: [createEmptyProblem()] });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialProblemIndex);
  const [pageInput, setPageInput] = useState(String(initialProblemIndex + 1));
  const [hashtagInput, setHashtagInput] = useState<Record<number, string>>({});
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [problemBulkDialogOpen, setProblemBulkDialogOpen] = useState(false);
  const [problemBulkText, setProblemBulkText] = useState('');
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [noAnswerWarningOpen, setNoAnswerWarningOpen] = useState(false);
  const [unansweredProblems, setUnansweredProblems] = useState<number[]>([]);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const initialDataRef = useRef<string>('');
  const dataRef = useRef(data);
  dataRef.current = data;

  const handleCopyProblem = useCallback(() => {
    if (!dataRef.current?.problems?.[currentIndex]) return;
    const currentProb = dataRef.current.problems[currentIndex];

    // 백슬래시(\) 제거 함수
    const cleanText = (text: string) => text.replace(/\\/g, '');

    const { question, description, choices } = currentProb;
    const choiceText = choices.map((c, i) => `${i + 1}) ${cleanText(c)}`).join('\n');
    const textToCopy = `${cleanText(question)}${description ? `\n\n${cleanText(description)}` : ''}\n\n${choiceText}`;

    navigator.clipboard.writeText(textToCopy);
    toast.success('복사되었습니다!');
  }, [currentIndex]);

  useEffect(() => {
    const loadScript = async () => {
      setLoading(true);
      const startIdx = initialProblemIndex ?? 0;
      setCurrentIndex(startIdx);
      setPageInput(String(startIdx + 1));
      try {
        const saved = await getFileScript(fileId);
        if (saved?.problems && saved.problems.length > 0) {
          const normalized: Problem[] = saved.problems.map((p: Partial<Problem>) => {
            const choices: string[] = Array.isArray(p.choices) ? p.choices : ['', '', '', ''];
            const rawExps: string[] = Array.isArray(p.choiceExplanations)
              ? p.choiceExplanations
              : [];
            const choiceExplanations = choices.map((_, i) => rawExps[i] || '');
            const isMultipleAnswer = Boolean(p.isMultipleAnswer);
            const rawAnswers = Array.isArray(p.answers)
              ? p.answers
              : typeof p.answer === 'number' && p.answer > 0
                ? [p.answer]
                : [];
            const showMultipleCount =
              p.showMultipleCount !== undefined ? Boolean(p.showMultipleCount) : true;
            const disableChoiceShuffle = Boolean(p.disableChoiceShuffle);
            const isHold = Boolean(p.isHold);

            const explanationFormulas = Array.isArray(p.explanationFormulas)
              ? p.explanationFormulas
              : p.explanationFormula
                ? [p.explanationFormula]
                : [];

            const erds = Array.isArray(p.erds) ? p.erds : p.erd ? [p.erd] : [];
            const explanationErds = Array.isArray(p.explanationErds)
              ? p.explanationErds
              : p.explanationErd
                ? [p.explanationErd]
                : [];

            const charts = Array.isArray(p.charts) ? p.charts : p.chart ? [p.chart] : [];
            const explanationCharts = Array.isArray(p.explanationCharts)
              ? p.explanationCharts
              : p.explanationChart
                ? [p.explanationChart]
                : [];

            const choiceDescriptions = choices.map((_, i) =>
              Array.isArray(p.choiceDescriptions) ? p.choiceDescriptions[i] || '' : ''
            );
            const choiceFormulas = choices.map((_, i) =>
              Array.isArray(p.choiceFormulas) && Array.isArray(p.choiceFormulas[i])
                ? p.choiceFormulas[i]
                : []
            );
            const choiceErds = choices.map((_, i) =>
              Array.isArray(p.choiceErds) && Array.isArray(p.choiceErds[i]) ? p.choiceErds[i] : []
            );
            const choiceCharts = choices.map((_, i) =>
              Array.isArray(p.choiceCharts) && Array.isArray(p.choiceCharts[i])
                ? p.choiceCharts[i]
                : []
            );

            const choiceExplanationDescriptions = choices.map((_, i) =>
              Array.isArray(p.choiceExplanationDescriptions)
                ? p.choiceExplanationDescriptions[i] || ''
                : ''
            );
            const choiceExplanationFormulas = choices.map((_, i) =>
              Array.isArray(p.choiceExplanationFormulas) &&
              Array.isArray(p.choiceExplanationFormulas[i])
                ? p.choiceExplanationFormulas[i]
                : []
            );
            const choiceExplanationErds = choices.map((_, i) =>
              Array.isArray(p.choiceExplanationErds) && Array.isArray(p.choiceExplanationErds[i])
                ? p.choiceExplanationErds[i]
                : []
            );
            const choiceExplanationCharts = choices.map((_, i) =>
              Array.isArray(p.choiceExplanationCharts) &&
              Array.isArray(p.choiceExplanationCharts[i])
                ? p.choiceExplanationCharts[i]
                : []
            );

            return {
              ...createEmptyProblem(),
              ...p,
              choices,
              choiceDescriptions,
              choiceFormulas,
              choiceErds,
              choiceCharts,
              choiceExplanations,
              choiceExplanationDescriptions,
              choiceExplanationFormulas,
              choiceExplanationErds,
              choiceExplanationCharts,
              formulas: Array.isArray(p.formulas) ? p.formulas : p.formula ? [p.formula] : [],
              explanationFormulas,
              erds,
              explanationErds,
              charts,
              explanationCharts,
              isMultipleAnswer,
              answers: rawAnswers,
              showMultipleCount,
              disableChoiceShuffle,
              isHold,
            };
          });
          const nextData = { problems: normalized };
          setData(nextData);
          initialDataRef.current = JSON.stringify(nextData);
          const validIndex = Math.min(Math.max(0, startIdx), normalized.length - 1);
          setCurrentIndex(validIndex);
          setPageInput(String(validIndex + 1));
        } else {
          const fallbackData = { problems: [createEmptyProblem()] };
          setData(fallbackData);
          initialDataRef.current = JSON.stringify(fallbackData);
        }
      } catch (error) {
        console.error('Failed to load problem set', error);
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, [fileId, initialProblemIndex]);

  useEffect(() => {
    if (currentIndex >= data.problems.length) {
      setCurrentIndex(Math.max(0, data.problems.length - 1));
    }
  }, [data.problems.length, currentIndex]);

  useEffect(() => {
    setPageInput(String(currentIndex + 1));
  }, [currentIndex]);

  const executeSave = useCallback(async (): Promise<boolean> => {
    const currentData = dataRef.current;
    try {
      await saveFileScript(fileId, currentData);
      initialDataRef.current = JSON.stringify(currentData);
      onSave?.(fileId);
      toast.success('문제 모음이 저장되었습니다!');
      onSaveSuccess?.(currentIndex);
      return true;
    } catch (error) {
      console.error('Failed to save problem set', error);
      toast.error('저장에 실패했습니다.');
      return false;
    }
  }, [fileId, onSave, onSaveSuccess, currentIndex]);

  const handleSave = useCallback(
    async (forceSave = false): Promise<boolean> => {
      if (!forceSave) {
        const currentProblems = dataRef.current.problems || [];
        const missingAnswers: number[] = [];
        currentProblems.forEach((p, idx) => {
          if (p.isMultipleAnswer) {
            if (!p.answers || p.answers.length === 0) {
              missingAnswers.push(idx + 1);
            }
          } else if (!p.answer || p.answer <= 0) {
            missingAnswers.push(idx + 1);
          }
        });

        if (missingAnswers.length > 0) {
          setUnansweredProblems(missingAnswers);
          setNoAnswerWarningOpen(true);
          return false;
        }
      }
      return executeSave();
    },
    [executeSave]
  );

  const handlePrevProblem = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextProblem = useCallback(() => {
    setCurrentIndex((prev) => Math.min(dataRef.current.problems.length - 1, prev + 1));
  }, []);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPageInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= dataRef.current.problems.length) {
      setCurrentIndex(num - 1);
    }
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const num = parseInt(pageInput, 10);
    const total = dataRef.current.problems.length;
    if (isNaN(num) || num < 1) {
      setCurrentIndex(0);
      setPageInput('1');
    } else if (num > total) {
      setCurrentIndex(total - 1);
      setPageInput(String(total));
    } else {
      setCurrentIndex(num - 1);
      setPageInput(String(num));
    }
  }, [pageInput]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePageInputBlur();
      }
    },
    [handlePageInputBlur]
  );

  const handleAddProblem = useCallback(() => {
    setData((prev) => {
      const currentProb = prev.problems[currentIndex] || prev.problems[prev.problems.length - 1];
      const currentChoicesCount = currentProb?.choices?.length || 4;
      const newProblems = [...prev.problems, createEmptyProblem(currentChoicesCount)];
      const nextIndex = newProblems.length - 1;
      setCurrentIndex(nextIndex);
      setPageInput(String(nextIndex + 1));
      return { ...prev, problems: newProblems };
    });

    // 새 문제 생성 후 문제 입력 칸으로 자동 포커스
    setTimeout(() => {
      const el = document.getElementById('problem-editor-question-input');
      if (el) {
        el.focus();
      }
    }, 60);
  }, [currentIndex]);

  const updateProblem = useCallback(
    (index: number, updates: Partial<Problem> | ((prev: Problem) => Partial<Problem>)) => {
      setData((prev) => {
        const currentProblem = prev.problems[index];
        if (!currentProblem) return prev;
        const resolved = typeof updates === 'function' ? updates(currentProblem) : updates;
        const newProblems = [...prev.problems];
        newProblems[index] = { ...currentProblem, ...resolved };
        return { ...prev, problems: newProblems };
      });
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        handleCopyProblem();
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        handleAddProblem();
        return;
      }

      if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const target = event.target as HTMLElement;
        const isInput =
          (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'number') ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (isInput) return;

        const currentProblems = dataRef.current?.problems;
        if (!currentProblems || currentProblems.length <= 1) return;

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.min(currentProblems.length - 1, prev + 1));
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [handleSave, handleAddProblem]);

  const handleDuplicateProblem = useCallback((index: number) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      const duplicated = JSON.parse(JSON.stringify(prev.problems[index])) as Problem;
      newProblems.splice(index + 1, 0, duplicated);
      setCurrentIndex(index + 1);
      return { ...prev, problems: newProblems };
    });
  }, []);

  const handleRemoveProblem = useCallback((index: number) => {
    setDeleteConfirmIndex(index);
  }, []);

  const handleConfirmRemoveProblem = useCallback(() => {
    if (deleteConfirmIndex === null) return;
    const index = deleteConfirmIndex;
    setData((prev) => {
      if (prev.problems.length <= 1) return prev;
      const newProblems = prev.problems.filter((_, i) => i !== index);
      const nextIndex = Math.min(currentIndex, newProblems.length - 1);
      setCurrentIndex(nextIndex);
      setPageInput(String(nextIndex + 1));
      return { ...prev, problems: newProblems };
    });
    setDeleteConfirmIndex(null);
  }, [deleteConfirmIndex, currentIndex]);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmIndex(null);
  }, []);

  const handleAddHashtag = useCallback(
    (problemIndex: number, tag: string) => {
      const cleaned = tag.trim();
      if (!cleaned) return;
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      updateProblem(problemIndex, (prob) => {
        if (prob.hashtags.includes(formatted)) return {};
        return { hashtags: [...prob.hashtags, formatted] };
      });
      setHashtagInput((prev) => ({ ...prev, [problemIndex]: '' }));
    },
    [updateProblem]
  );

  const handleRemoveHashtag = useCallback(
    (problemIndex: number, tagIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        hashtags: prob.hashtags.filter((_, i) => i !== tagIndex),
      }));
    },
    [updateProblem]
  );

  const handleAddFormula = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        formulas: [...(prob.formulas || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeFormula = useCallback(
    (problemIndex: number, formulaIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentFormulas = [...(prob.formulas || [])];
        currentFormulas[formulaIndex] = value;
        return { formulas: currentFormulas };
      });
    },
    [updateProblem]
  );

  const handleRemoveFormula = useCallback(
    (problemIndex: number, formulaIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        formulas: (prob.formulas || []).filter((_, i) => i !== formulaIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertSymbol = useCallback(
    (problemIndex: number, formulaIndex: number, symbol: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentFormulas = [...(prob.formulas || [])];
        const currentText = currentFormulas[formulaIndex] || '';
        currentFormulas[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
        return { formulas: currentFormulas };
      });
    },
    [updateProblem]
  );

  const handleAddExplanationFormula = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationFormulas: [...(prob.explanationFormulas || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeExplanationFormula = useCallback(
    (problemIndex: number, formulaIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationFormulas || [])];
        current[formulaIndex] = value;
        return { explanationFormulas: current };
      });
    },
    [updateProblem]
  );

  const handleRemoveExplanationFormula = useCallback(
    (problemIndex: number, formulaIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationFormulas: (prob.explanationFormulas || []).filter((_, i) => i !== formulaIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertExplanationSymbol = useCallback(
    (problemIndex: number, formulaIndex: number, symbol: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationFormulas || [])];
        const currentText = current[formulaIndex] || '';
        current[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
        return { explanationFormulas: current };
      });
    },
    [updateProblem]
  );

  const handleAddErd = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        erds: [...(prob.erds || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeErd = useCallback(
    (problemIndex: number, erdIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentErds = [...(prob.erds || [])];
        currentErds[erdIndex] = value;
        return { erds: currentErds };
      });
    },
    [updateProblem]
  );

  const handleRemoveErd = useCallback(
    (problemIndex: number, erdIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        erds: (prob.erds || []).filter((_, i) => i !== erdIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertErdTemplate = useCallback(
    (problemIndex: number, erdIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentErds = [...(prob.erds || [])];
        const currentText = currentErds[erdIndex] || '';
        currentErds[erdIndex] = currentText ? `${currentText}\n${template}` : template;
        return { erds: currentErds };
      });
    },
    [updateProblem]
  );

  const handleAddExplanationErd = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationErds: [...(prob.explanationErds || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeExplanationErd = useCallback(
    (problemIndex: number, erdIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationErds || [])];
        current[erdIndex] = value;
        return { explanationErds: current };
      });
    },
    [updateProblem]
  );

  const handleRemoveExplanationErd = useCallback(
    (problemIndex: number, erdIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationErds: (prob.explanationErds || []).filter((_, i) => i !== erdIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertExplanationErdTemplate = useCallback(
    (problemIndex: number, erdIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationErds || [])];
        const currentText = current[erdIndex] || '';
        current[erdIndex] = currentText ? `${currentText}\n${template}` : template;
        return { explanationErds: current };
      });
    },
    [updateProblem]
  );

  // Problem Chart Handlers
  const handleAddChart = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        charts: [...(prob.charts || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeChart = useCallback(
    (problemIndex: number, chartIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentCharts = [...(prob.charts || [])];
        currentCharts[chartIndex] = value;
        return { charts: currentCharts };
      });
    },
    [updateProblem]
  );

  const handleRemoveChart = useCallback(
    (problemIndex: number, chartIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        charts: (prob.charts || []).filter((_, i) => i !== chartIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertChartTemplate = useCallback(
    (problemIndex: number, chartIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const currentCharts = [...(prob.charts || [])];
        const currentText = currentCharts[chartIndex] || '';
        currentCharts[chartIndex] = currentText ? `${currentText}\n${template}` : template;
        return { charts: currentCharts };
      });
    },
    [updateProblem]
  );

  // Explanation Chart Handlers
  const handleAddExplanationChart = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationCharts: [...(prob.explanationCharts || []), ''],
      }));
    },
    [updateProblem]
  );

  const handleChangeExplanationChart = useCallback(
    (problemIndex: number, chartIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationCharts || [])];
        current[chartIndex] = value;
        return { explanationCharts: current };
      });
    },
    [updateProblem]
  );

  const handleRemoveExplanationChart = useCallback(
    (problemIndex: number, chartIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        explanationCharts: (prob.explanationCharts || []).filter((_, i) => i !== chartIndex),
      }));
    },
    [updateProblem]
  );

  const handleInsertExplanationChartTemplate = useCallback(
    (problemIndex: number, chartIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.explanationCharts || [])];
        const currentText = current[chartIndex] || '';
        current[chartIndex] = currentText ? `${currentText}\n${template}` : template;
        return { explanationCharts: current };
      });
    },
    [updateProblem]
  );

  const handleAddChoice = useCallback(
    (problemIndex: number) => {
      updateProblem(problemIndex, (prob) => ({
        choices: [...(prob.choices || []), ''],
        choiceDescriptions: [...(prob.choiceDescriptions || []), ''],
        choiceFormulas: [...(prob.choiceFormulas || []), []],
        choiceErds: [...(prob.choiceErds || []), []],
        choiceCharts: [...(prob.choiceCharts || []), []],
        choiceExplanations: [...(prob.choiceExplanations || []), ''],
        choiceExplanationDescriptions: [...(prob.choiceExplanationDescriptions || []), ''],
        choiceExplanationFormulas: [...(prob.choiceExplanationFormulas || []), []],
        choiceExplanationErds: [...(prob.choiceExplanationErds || []), []],
        choiceExplanationCharts: [...(prob.choiceExplanationCharts || []), []],
      }));
    },
    [updateProblem]
  );

  const handleRemoveChoice = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const currentChoices = prob.choices || [];
        if (currentChoices.length <= 2) return {};

        const currentExplanations = prob.choiceExplanations || [];
        const newChoices = currentChoices.filter((_, i) => i !== choiceIndex);
        const newExplanations = currentExplanations.filter((_, i) => i !== choiceIndex);

        let newAnswer = prob.answer;
        const choiceNum = choiceIndex + 1;
        if (prob.answer === choiceNum) {
          newAnswer = 0;
        } else if (prob.answer > choiceNum) {
          newAnswer = prob.answer - 1;
        }

        let newAnswers = prob.answers;
        if (Array.isArray(prob.answers) && prob.answers.length > 0) {
          newAnswers = prob.answers
            .filter((a) => a !== choiceNum)
            .map((a) => (a > choiceNum ? a - 1 : a));
        }

        return {
          choices: newChoices,
          choiceDescriptions: (prob.choiceDescriptions || []).filter((_, i) => i !== choiceIndex),
          choiceFormulas: (prob.choiceFormulas || []).filter((_, i) => i !== choiceIndex),
          choiceErds: (prob.choiceErds || []).filter((_, i) => i !== choiceIndex),
          choiceCharts: (prob.choiceCharts || []).filter((_, i) => i !== choiceIndex),
          choiceExplanations: newExplanations,
          choiceExplanationDescriptions: (prob.choiceExplanationDescriptions || []).filter(
            (_, i) => i !== choiceIndex
          ),
          choiceExplanationFormulas: (prob.choiceExplanationFormulas || []).filter(
            (_, i) => i !== choiceIndex
          ),
          choiceExplanationErds: (prob.choiceExplanationErds || []).filter(
            (_, i) => i !== choiceIndex
          ),
          choiceExplanationCharts: (prob.choiceExplanationCharts || []).filter(
            (_, i) => i !== choiceIndex
          ),
          answer: newAnswer,
          answers: newAnswers,
        };
      });
    },
    [updateProblem]
  );

  const handleReorderChoices = useCallback(
    (problemIndex: number, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      updateProblem(problemIndex, (prob) => {
        const reorderArray = <T>(arr: T[] | undefined, defaultVal: T): T[] => {
          const fullArr = prob.choices.map((_, i) =>
            arr && arr[i] !== undefined ? arr[i] : defaultVal
          );
          return arrayMove(fullArr, oldIndex, newIndex);
        };

        const newChoices = reorderArray(prob.choices, '');
        const newChoiceDescriptions = reorderArray(prob.choiceDescriptions, '');
        const newChoiceFormulas = reorderArray(prob.choiceFormulas, []);
        const newChoiceErds = reorderArray(prob.choiceErds, []);
        const newChoiceCharts = reorderArray(prob.choiceCharts, []);
        const newChoiceExplanations = reorderArray(prob.choiceExplanations, '');
        const newChoiceExplanationDescriptions = reorderArray(
          prob.choiceExplanationDescriptions,
          ''
        );
        const newChoiceExplanationFormulas = reorderArray(prob.choiceExplanationFormulas, []);
        const newChoiceExplanationErds = reorderArray(prob.choiceExplanationErds, []);
        const newChoiceExplanationCharts = reorderArray(prob.choiceExplanationCharts, []);

        const originalAnswerNumbers = prob.choices.map((_, i) => i + 1);
        const reorderedAnswerNumbers = arrayMove(originalAnswerNumbers, oldIndex, newIndex);

        let newAnswer = prob.answer;
        if (prob.answer > 0) {
          const newPos = reorderedAnswerNumbers.indexOf(prob.answer);
          if (newPos !== -1) {
            newAnswer = newPos + 1;
          }
        }

        let newAnswers = prob.answers;
        if (Array.isArray(prob.answers) && prob.answers.length > 0) {
          newAnswers = prob.answers.map((ans) => {
            const newPos = reorderedAnswerNumbers.indexOf(ans);
            return newPos !== -1 ? newPos + 1 : ans;
          });
        }

        return {
          choices: newChoices,
          choiceDescriptions: newChoiceDescriptions,
          choiceFormulas: newChoiceFormulas,
          choiceErds: newChoiceErds,
          choiceCharts: newChoiceCharts,
          choiceExplanations: newChoiceExplanations,
          choiceExplanationDescriptions: newChoiceExplanationDescriptions,
          choiceExplanationFormulas: newChoiceExplanationFormulas,
          choiceExplanationErds: newChoiceExplanationErds,
          choiceExplanationCharts: newChoiceExplanationCharts,
          answer: newAnswer,
          answers: newAnswers,
        };
      });
    },
    [updateProblem]
  );

  const handleChangeChoice = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const newChoices = [...prob.choices];
        newChoices[choiceIndex] = value;
        return { choices: newChoices };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceExplanation = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const newExplanations = [...prob.choiceExplanations];
        newExplanations[choiceIndex] = value;
        return { choiceExplanations: newExplanations };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceDescription = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.choiceDescriptions || [])];
        current[choiceIndex] = value;
        return { choiceDescriptions: current };
      });
    },
    [updateProblem]
  );

  const handleAddChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        allFormulas[choiceIndex] = [...(allFormulas[choiceIndex] || []), ''];
        return { choiceFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = [...(allFormulas[choiceIndex] || [])];
        choiceForms[formulaIndex] = value;
        allFormulas[choiceIndex] = choiceForms;
        return { choiceFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = (allFormulas[choiceIndex] || []).filter((_, i) => i !== formulaIndex);
        allFormulas[choiceIndex] = choiceForms;
        return { choiceFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceSymbol = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, symbol: string) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = [...(allFormulas[choiceIndex] || [])];
        const currentText = choiceForms[formulaIndex] || '';
        choiceForms[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
        allFormulas[choiceIndex] = choiceForms;
        return { choiceFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleAddChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        allErds[choiceIndex] = [...(allErds[choiceIndex] || []), ''];
        return { choiceErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = [...(allErds[choiceIndex] || [])];
        choiceErdsList[erdIndex] = value;
        allErds[choiceIndex] = choiceErdsList;
        return { choiceErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = (allErds[choiceIndex] || []).filter((_, i) => i !== erdIndex);
        allErds[choiceIndex] = choiceErdsList;
        return { choiceErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceErdTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = [...(allErds[choiceIndex] || [])];
        const currentText = choiceErdsList[erdIndex] || '';
        choiceErdsList[erdIndex] = currentText ? `${currentText}\n${template}` : template;
        allErds[choiceIndex] = choiceErdsList;
        return { choiceErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceExplanationDescription = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const current = [...(prob.choiceExplanationDescriptions || [])];
        current[choiceIndex] = value;
        return { choiceExplanationDescriptions: current };
      });
    },
    [updateProblem]
  );

  const handleAddChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceExplanationFormulas
          ? prob.choiceExplanationFormulas.map((arr) => [...arr])
          : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        allFormulas[choiceIndex] = [...(allFormulas[choiceIndex] || []), ''];
        return { choiceExplanationFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceExplanationFormulas
          ? prob.choiceExplanationFormulas.map((arr) => [...arr])
          : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = [...(allFormulas[choiceIndex] || [])];
        choiceForms[formulaIndex] = value;
        allFormulas[choiceIndex] = choiceForms;
        return { choiceExplanationFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceExplanationFormulas
          ? prob.choiceExplanationFormulas.map((arr) => [...arr])
          : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = (allFormulas[choiceIndex] || []).filter((_, i) => i !== formulaIndex);
        allFormulas[choiceIndex] = choiceForms;
        return { choiceExplanationFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceExplanationSymbol = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, symbol: string) => {
      updateProblem(problemIndex, (prob) => {
        const allFormulas = prob.choiceExplanationFormulas
          ? prob.choiceExplanationFormulas.map((arr) => [...arr])
          : [];
        while (allFormulas.length <= choiceIndex) allFormulas.push([]);
        const choiceForms = [...(allFormulas[choiceIndex] || [])];
        const currentText = choiceForms[formulaIndex] || '';
        choiceForms[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
        allFormulas[choiceIndex] = choiceForms;
        return { choiceExplanationFormulas: allFormulas };
      });
    },
    [updateProblem]
  );

  const handleAddChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceExplanationErds
          ? prob.choiceExplanationErds.map((arr) => [...arr])
          : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        allErds[choiceIndex] = [...(allErds[choiceIndex] || []), ''];
        return { choiceExplanationErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceExplanationErds
          ? prob.choiceExplanationErds.map((arr) => [...arr])
          : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = [...(allErds[choiceIndex] || [])];
        choiceErdsList[erdIndex] = value;
        allErds[choiceIndex] = choiceErdsList;
        return { choiceExplanationErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceExplanationErds
          ? prob.choiceExplanationErds.map((arr) => [...arr])
          : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = (allErds[choiceIndex] || []).filter((_, i) => i !== erdIndex);
        allErds[choiceIndex] = choiceErdsList;
        return { choiceExplanationErds: allErds };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceExplanationErdTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const allErds = prob.choiceExplanationErds
          ? prob.choiceExplanationErds.map((arr) => [...arr])
          : [];
        while (allErds.length <= choiceIndex) allErds.push([]);
        const choiceErdsList = [...(allErds[choiceIndex] || [])];
        const currentText = choiceErdsList[erdIndex] || '';
        choiceErdsList[erdIndex] = currentText ? `${currentText}\n${template}` : template;
        allErds[choiceIndex] = choiceErdsList;
        return { choiceExplanationErds: allErds };
      });
    },
    [updateProblem]
  );

  // Choice Chart Handlers
  const handleAddChoiceChart = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceCharts ? prob.choiceCharts.map((arr) => [...arr]) : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        allCharts[choiceIndex] = [...(allCharts[choiceIndex] || []), ''];
        return { choiceCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceChart = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceCharts ? prob.choiceCharts.map((arr) => [...arr]) : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = [...(allCharts[choiceIndex] || [])];
        choiceChartsList[chartIndex] = value;
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceChart = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceCharts ? prob.choiceCharts.map((arr) => [...arr]) : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = (allCharts[choiceIndex] || []).filter((_, i) => i !== chartIndex);
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceChartTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceCharts ? prob.choiceCharts.map((arr) => [...arr]) : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = [...(allCharts[choiceIndex] || [])];
        const currentText = choiceChartsList[chartIndex] || '';
        choiceChartsList[chartIndex] = currentText ? `${currentText}\n${template}` : template;
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceCharts: allCharts };
      });
    },
    [updateProblem]
  );

  // Choice Explanation Chart Handlers
  const handleAddChoiceExplanationChart = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceExplanationCharts
          ? prob.choiceExplanationCharts.map((arr) => [...arr])
          : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        allCharts[choiceIndex] = [...(allCharts[choiceIndex] || []), ''];
        return { choiceExplanationCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleChangeChoiceExplanationChart = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number, value: string) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceExplanationCharts
          ? prob.choiceExplanationCharts.map((arr) => [...arr])
          : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = [...(allCharts[choiceIndex] || [])];
        choiceChartsList[chartIndex] = value;
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceExplanationCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleRemoveChoiceExplanationChart = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceExplanationCharts
          ? prob.choiceExplanationCharts.map((arr) => [...arr])
          : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = (allCharts[choiceIndex] || []).filter((_, i) => i !== chartIndex);
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceExplanationCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const handleInsertChoiceExplanationChartTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, chartIndex: number, template: string) => {
      updateProblem(problemIndex, (prob) => {
        const allCharts = prob.choiceExplanationCharts
          ? prob.choiceExplanationCharts.map((arr) => [...arr])
          : [];
        while (allCharts.length <= choiceIndex) allCharts.push([]);
        const choiceChartsList = [...(allCharts[choiceIndex] || [])];
        const currentText = choiceChartsList[chartIndex] || '';
        choiceChartsList[chartIndex] = currentText ? `${currentText}\n${template}` : template;
        allCharts[choiceIndex] = choiceChartsList;
        return { choiceExplanationCharts: allCharts };
      });
    },
    [updateProblem]
  );

  const activeProblemIndex = Math.min(currentIndex, Math.max(0, data.problems.length - 1));
  const activeProblem =
    data.problems[activeProblemIndex] || data.problems[0] || createEmptyProblem();

  const handleOpenBulkDialog = useCallback(() => {
    const currentChoices = dataRef.current.problems[activeProblemIndex]?.choices || [];
    setBulkText(currentChoices.filter(Boolean).join('\n'));
    setBulkDialogOpen(true);
  }, [activeProblemIndex]);

  const handleApplyBulk = useCallback(
    (appliedText?: string) => {
      const raw = typeof appliedText === 'string' ? appliedText : bulkText;
      const lines = raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^\s*(?:\d+[.)]|\(\d+\)|[①-⑮])\s*/, ''));

      updateProblem(activeProblemIndex, (prob) => {
        const currentChoices = prob.choices || [];
        const newChoices = currentChoices.map((existing, i) => (i < lines.length ? lines[i] : ''));
        return { choices: newChoices };
      });
      setBulkDialogOpen(false);
      toast.success('선택지가 일괄 적용되었습니다.');
    },
    [bulkText, updateProblem, activeProblemIndex]
  );

  const handleOpenProblemBulkDialog = useCallback(() => {
    const prob = dataRef.current.problems[activeProblemIndex];
    const question = prob?.question || '';
    const currentChoices = prob?.choices || [];
    const lines = [question, ...currentChoices].filter(Boolean);
    setProblemBulkText(lines.join('\n'));
    setProblemBulkDialogOpen(true);
  }, [activeProblemIndex]);

  const handleApplyProblemBulk = useCallback(
    (appliedText?: string) => {
      const raw = typeof appliedText === 'string' ? appliedText : problemBulkText;
      const lines = raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^\s*(?:\d+[.)]|\(\d+\)|[①-⑮])\s*/, ''));

      const newQuestion = lines[0] || '';
      const choiceLines = lines.slice(1);

      updateProblem(activeProblemIndex, (prob) => {
        const currentChoices = prob.choices || [];
        const targetLength = Math.max(currentChoices.length, choiceLines.length);
        const newChoices = Array.from({ length: targetLength }, (_, i) =>
          i < choiceLines.length ? choiceLines[i] : currentChoices[i] || ''
        );
        const currentExplanations = prob.choiceExplanations || [];
        const newExplanations = newChoices.map((_, i) => currentExplanations[i] || '');

        return {
          question: newQuestion,
          choices: newChoices,
          choiceExplanations: newExplanations,
        };
      });

      setProblemBulkDialogOpen(false);
      toast.success('문제 및 선택지가 일괄 적용되었습니다.');
    },
    [problemBulkText, updateProblem, activeProblemIndex]
  );

  const handleOpenReorderDialog = useCallback(() => {
    setReorderDialogOpen(true);
  }, []);

  const handleApplyReorderProblems = useCallback(
    (newProblems: Problem[], newActiveIndex: number) => {
      setData({ problems: newProblems });
      const validIndex = Math.min(Math.max(0, newActiveIndex), newProblems.length - 1);
      setCurrentIndex(validIndex);
      setPageInput(String(validIndex + 1));
      toast.success('문제 순서가 변경되었습니다.');
    },
    []
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!initialDataRef.current) return false;
    return JSON.stringify(data) !== initialDataRef.current;
  }, [data]);

  return {
    data,
    loading,
    hasUnsavedChanges,
    currentIndex,
    activeProblemIndex,
    activeProblem,
    pageInput,
    hashtagInput,
    setHashtagInput,
    bulkDialogOpen,
    setBulkDialogOpen,
    bulkText,
    setBulkText,
    problemBulkDialogOpen,
    setProblemBulkDialogOpen,
    problemBulkText,
    setProblemBulkText,
    reorderDialogOpen,
    setReorderDialogOpen,
    noAnswerWarningOpen,
    setNoAnswerWarningOpen,
    unansweredProblems,
    handleOpenReorderDialog,
    handleApplyReorderProblems,
    handleSave,
    handlePrevProblem,
    handleNextProblem,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
    handleAddProblem,
    updateProblem,
    handleDuplicateProblem,
    handleRemoveProblem,
    deleteConfirmIndex,
    handleConfirmRemoveProblem,
    handleCloseDeleteConfirm,
    handleAddHashtag,
    handleRemoveHashtag,
    handleAddFormula,
    handleChangeFormula,
    handleRemoveFormula,
    handleInsertSymbol,
    handleAddExplanationFormula,
    handleChangeExplanationFormula,
    handleRemoveExplanationFormula,
    handleInsertExplanationSymbol,
    handleAddErd,
    handleChangeErd,
    handleRemoveErd,
    handleInsertErdTemplate,
    handleAddExplanationErd,
    handleChangeExplanationErd,
    handleRemoveExplanationErd,
    handleInsertExplanationErdTemplate,
    handleAddChart,
    handleChangeChart,
    handleRemoveChart,
    handleInsertChartTemplate,
    handleAddExplanationChart,
    handleChangeExplanationChart,
    handleRemoveExplanationChart,
    handleInsertExplanationChartTemplate,
    handleAddChoice,
    handleRemoveChoice,
    handleReorderChoices,
    handleChangeChoice,
    handleChangeChoiceExplanation,
    handleChangeChoiceDescription,
    handleAddChoiceFormula,
    handleChangeChoiceFormula,
    handleRemoveChoiceFormula,
    handleInsertChoiceSymbol,
    handleAddChoiceErd,
    handleChangeChoiceErd,
    handleRemoveChoiceErd,
    handleInsertChoiceErdTemplate,
    handleAddChoiceChart,
    handleChangeChoiceChart,
    handleRemoveChoiceChart,
    handleInsertChoiceChartTemplate,
    handleChangeChoiceExplanationDescription,
    handleAddChoiceExplanationFormula,
    handleChangeChoiceExplanationFormula,
    handleRemoveChoiceExplanationFormula,
    handleInsertChoiceExplanationSymbol,
    handleAddChoiceExplanationErd,
    handleChangeChoiceExplanationErd,
    handleRemoveChoiceExplanationErd,
    handleInsertChoiceExplanationErdTemplate,
    handleAddChoiceExplanationChart,
    handleChangeChoiceExplanationChart,
    handleRemoveChoiceExplanationChart,
    handleInsertChoiceExplanationChartTemplate,
    handleOpenBulkDialog,
    handleApplyBulk,
    handleOpenProblemBulkDialog,
    handleApplyProblemBulk,
    handleCopyProblem,
  };
}
