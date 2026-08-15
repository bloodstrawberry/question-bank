import type { Problem, ProblemSetData } from './types';

import { useState, useEffect, useCallback, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

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

  const initialDataRef = useRef<string>('');

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

            return {
              ...createEmptyProblem(),
              ...p,
              choices,
              choiceDescriptions,
              choiceFormulas,
              choiceErds,
              choiceExplanations,
              choiceExplanationDescriptions,
              choiceExplanationFormulas,
              choiceExplanationErds,
              formulas: Array.isArray(p.formulas) ? p.formulas : p.formula ? [p.formula] : [],
              explanationFormulas,
              erds,
              explanationErds,
              isMultipleAnswer,
              answers: rawAnswers,
              showMultipleCount,
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

  const handleSave = useCallback(async () => {
    try {
      await saveFileScript(fileId, data);
      initialDataRef.current = JSON.stringify(data);
      onSave?.(fileId);
      toast.success('문제 모음이 저장되었습니다!');
      onSaveSuccess?.(currentIndex);
    } catch (error) {
      console.error('Failed to save problem set', error);
      toast.error('저장에 실패했습니다.');
    }
  }, [fileId, data, onSave, onSaveSuccess, currentIndex]);

  const handlePrevProblem = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextProblem = useCallback(() => {
    setCurrentIndex((prev) => Math.min(data.problems.length - 1, prev + 1));
  }, [data.problems.length]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPageInput(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= data.problems.length) {
        setCurrentIndex(num - 1);
      }
    },
    [data.problems.length]
  );

  const handlePageInputBlur = useCallback(() => {
    const num = parseInt(pageInput, 10);
    if (isNaN(num) || num < 1) {
      setCurrentIndex(0);
      setPageInput('1');
    } else if (num > data.problems.length) {
      setCurrentIndex(data.problems.length - 1);
      setPageInput(String(data.problems.length));
    } else {
      setCurrentIndex(num - 1);
      setPageInput(String(num));
    }
  }, [data.problems.length, pageInput]);

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
      const newProblems = [...prev.problems, createEmptyProblem()];
      setCurrentIndex(newProblems.length - 1);
      return { ...prev, problems: newProblems };
    });
  }, []);

  const updateProblem = useCallback((index: number, updates: Partial<Problem>) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      newProblems[index] = { ...newProblems[index], ...updates };
      return { ...prev, problems: newProblems };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

        if (!data?.problems || data.problems.length <= 1) return;

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.min(data.problems.length - 1, prev + 1));
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [data?.problems, handleSave, handleAddProblem]);

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
    setData((prev) => {
      if (prev.problems.length <= 1) return prev;
      const newProblems = prev.problems.filter((_, i) => i !== index);
      setCurrentIndex((curr) => {
        if (curr >= newProblems.length) return Math.max(0, newProblems.length - 1);
        return curr;
      });
      return { ...prev, problems: newProblems };
    });
  }, []);

  const handleAddHashtag = useCallback(
    (problemIndex: number, tag: string) => {
      const cleaned = tag.trim();
      if (!cleaned) return;
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      const current = data.problems[problemIndex].hashtags;
      if (!current.includes(formatted)) {
        updateProblem(problemIndex, { hashtags: [...current, formatted] });
      }
      setHashtagInput((prev) => ({ ...prev, [problemIndex]: '' }));
    },
    [data.problems, updateProblem]
  );

  const handleRemoveHashtag = useCallback(
    (problemIndex: number, tagIndex: number) => {
      const current = data.problems[problemIndex].hashtags;
      updateProblem(problemIndex, { hashtags: current.filter((_, i) => i !== tagIndex) });
    },
    [data.problems, updateProblem]
  );

  const handleAddFormula = useCallback(
    (problemIndex: number) => {
      const currentFormulas = data.problems[problemIndex].formulas || [];
      updateProblem(problemIndex, { formulas: [...currentFormulas, ''] });
    },
    [data.problems, updateProblem]
  );

  const handleChangeFormula = useCallback(
    (problemIndex: number, formulaIndex: number, value: string) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      currentFormulas[formulaIndex] = value;
      updateProblem(problemIndex, { formulas: currentFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveFormula = useCallback(
    (problemIndex: number, formulaIndex: number) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      const updated = currentFormulas.filter((_, i) => i !== formulaIndex);
      updateProblem(problemIndex, { formulas: updated });
    },
    [data.problems, updateProblem]
  );

  const handleInsertSymbol = useCallback(
    (problemIndex: number, formulaIndex: number, symbol: string) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      const currentText = currentFormulas[formulaIndex] || '';
      const updatedText = currentText ? `${currentText} ${symbol}` : symbol;
      currentFormulas[formulaIndex] = updatedText;
      updateProblem(problemIndex, { formulas: currentFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleAddExplanationFormula = useCallback(
    (problemIndex: number) => {
      const current = data.problems[problemIndex].explanationFormulas || [];
      updateProblem(problemIndex, { explanationFormulas: [...current, ''] });
    },
    [data.problems, updateProblem]
  );

  const handleChangeExplanationFormula = useCallback(
    (problemIndex: number, formulaIndex: number, value: string) => {
      const current = [...(data.problems[problemIndex].explanationFormulas || [])];
      current[formulaIndex] = value;
      updateProblem(problemIndex, { explanationFormulas: current });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveExplanationFormula = useCallback(
    (problemIndex: number, formulaIndex: number) => {
      const current = [...(data.problems[problemIndex].explanationFormulas || [])];
      const updated = current.filter((_, i) => i !== formulaIndex);
      updateProblem(problemIndex, { explanationFormulas: updated });
    },
    [data.problems, updateProblem]
  );

  const handleInsertExplanationSymbol = useCallback(
    (problemIndex: number, formulaIndex: number, symbol: string) => {
      const current = [...(data.problems[problemIndex].explanationFormulas || [])];
      const currentText = current[formulaIndex] || '';
      const updatedText = currentText ? `${currentText} ${symbol}` : symbol;
      current[formulaIndex] = updatedText;
      updateProblem(problemIndex, { explanationFormulas: current });
    },
    [data.problems, updateProblem]
  );

  const handleAddErd = useCallback(
    (problemIndex: number) => {
      const currentErds = data.problems[problemIndex].erds || [];
      updateProblem(problemIndex, { erds: [...currentErds, ''] });
    },
    [data.problems, updateProblem]
  );

  const handleChangeErd = useCallback(
    (problemIndex: number, erdIndex: number, value: string) => {
      const currentErds = [...(data.problems[problemIndex].erds || [])];
      currentErds[erdIndex] = value;
      updateProblem(problemIndex, { erds: currentErds });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveErd = useCallback(
    (problemIndex: number, erdIndex: number) => {
      const currentErds = [...(data.problems[problemIndex].erds || [])];
      const updated = currentErds.filter((_, i) => i !== erdIndex);
      updateProblem(problemIndex, { erds: updated });
    },
    [data.problems, updateProblem]
  );

  const handleInsertErdTemplate = useCallback(
    (problemIndex: number, erdIndex: number, template: string) => {
      const currentErds = [...(data.problems[problemIndex].erds || [])];
      const currentText = currentErds[erdIndex] || '';
      const updatedText = currentText ? `${currentText}\n${template}` : template;
      currentErds[erdIndex] = updatedText;
      updateProblem(problemIndex, { erds: currentErds });
    },
    [data.problems, updateProblem]
  );

  const handleAddExplanationErd = useCallback(
    (problemIndex: number) => {
      const current = data.problems[problemIndex].explanationErds || [];
      updateProblem(problemIndex, { explanationErds: [...current, ''] });
    },
    [data.problems, updateProblem]
  );

  const handleChangeExplanationErd = useCallback(
    (problemIndex: number, erdIndex: number, value: string) => {
      const current = [...(data.problems[problemIndex].explanationErds || [])];
      current[erdIndex] = value;
      updateProblem(problemIndex, { explanationErds: current });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveExplanationErd = useCallback(
    (problemIndex: number, erdIndex: number) => {
      const current = [...(data.problems[problemIndex].explanationErds || [])];
      const updated = current.filter((_, i) => i !== erdIndex);
      updateProblem(problemIndex, { explanationErds: updated });
    },
    [data.problems, updateProblem]
  );

  const handleInsertExplanationErdTemplate = useCallback(
    (problemIndex: number, erdIndex: number, template: string) => {
      const current = [...(data.problems[problemIndex].explanationErds || [])];
      const currentText = current[erdIndex] || '';
      const updatedText = currentText ? `${currentText}\n${template}` : template;
      current[erdIndex] = updatedText;
      updateProblem(problemIndex, { explanationErds: current });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoice = useCallback(
    (problemIndex: number) => {
      const prob = data.problems[problemIndex];
      const currentChoices = prob.choices || [];
      const currentExplanations = prob.choiceExplanations || [];
      const currentChoiceDescriptions = prob.choiceDescriptions || [];
      const currentChoiceFormulas = prob.choiceFormulas || [];
      const currentChoiceErds = prob.choiceErds || [];
      const currentChoiceExplanationDescriptions = prob.choiceExplanationDescriptions || [];
      const currentChoiceExplanationFormulas = prob.choiceExplanationFormulas || [];
      const currentChoiceExplanationErds = prob.choiceExplanationErds || [];

      updateProblem(problemIndex, {
        choices: [...currentChoices, ''],
        choiceDescriptions: [...currentChoiceDescriptions, ''],
        choiceFormulas: [...currentChoiceFormulas, []],
        choiceErds: [...currentChoiceErds, []],
        choiceExplanations: [...currentExplanations, ''],
        choiceExplanationDescriptions: [...currentChoiceExplanationDescriptions, ''],
        choiceExplanationFormulas: [...currentChoiceExplanationFormulas, []],
        choiceExplanationErds: [...currentChoiceExplanationErds, []],
      });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoice = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const currentChoices = prob.choices || [];
      if (currentChoices.length <= 2) return;

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

      updateProblem(problemIndex, {
        choices: newChoices,
        choiceDescriptions: (prob.choiceDescriptions || []).filter((_, i) => i !== choiceIndex),
        choiceFormulas: (prob.choiceFormulas || []).filter((_, i) => i !== choiceIndex),
        choiceErds: (prob.choiceErds || []).filter((_, i) => i !== choiceIndex),
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
        answer: newAnswer,
      });
    },
    [data.problems, updateProblem]
  );

  const handleReorderChoices = useCallback(
    (problemIndex: number, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      const prob = data.problems[problemIndex];
      if (!prob) return;

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
      const newChoiceExplanations = reorderArray(prob.choiceExplanations, '');
      const newChoiceExplanationDescriptions = reorderArray(prob.choiceExplanationDescriptions, '');
      const newChoiceExplanationFormulas = reorderArray(prob.choiceExplanationFormulas, []);
      const newChoiceExplanationErds = reorderArray(prob.choiceExplanationErds, []);

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

      updateProblem(problemIndex, {
        choices: newChoices,
        choiceDescriptions: newChoiceDescriptions,
        choiceFormulas: newChoiceFormulas,
        choiceErds: newChoiceErds,
        choiceExplanations: newChoiceExplanations,
        choiceExplanationDescriptions: newChoiceExplanationDescriptions,
        choiceExplanationFormulas: newChoiceExplanationFormulas,
        choiceExplanationErds: newChoiceExplanationErds,
        answer: newAnswer,
        answers: newAnswers,
      });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoice = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      const newChoices = [...data.problems[problemIndex].choices];
      newChoices[choiceIndex] = value;
      updateProblem(problemIndex, { choices: newChoices });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceExplanation = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      const newExplanations = [...data.problems[problemIndex].choiceExplanations];
      newExplanations[choiceIndex] = value;
      updateProblem(problemIndex, { choiceExplanations: newExplanations });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceDescription = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const current = [...(prob.choiceDescriptions || [])];
      current[choiceIndex] = value;
      updateProblem(problemIndex, { choiceDescriptions: current });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      allFormulas[choiceIndex] = [...(allFormulas[choiceIndex] || []), ''];
      updateProblem(problemIndex, { choiceFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = [...(allFormulas[choiceIndex] || [])];
      choiceForms[formulaIndex] = value;
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoiceFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = (allFormulas[choiceIndex] || []).filter((_, i) => i !== formulaIndex);
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleInsertChoiceSymbol = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, symbol: string) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceFormulas ? prob.choiceFormulas.map((arr) => [...arr]) : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = [...(allFormulas[choiceIndex] || [])];
      const currentText = choiceForms[formulaIndex] || '';
      choiceForms[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      allErds[choiceIndex] = [...(allErds[choiceIndex] || []), ''];
      updateProblem(problemIndex, { choiceErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = [...(allErds[choiceIndex] || [])];
      choiceErdsList[erdIndex] = value;
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoiceErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = (allErds[choiceIndex] || []).filter((_, i) => i !== erdIndex);
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleInsertChoiceErdTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, template: string) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceErds ? prob.choiceErds.map((arr) => [...arr]) : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = [...(allErds[choiceIndex] || [])];
      const currentText = choiceErdsList[erdIndex] || '';
      choiceErdsList[erdIndex] = currentText ? `${currentText}\n${template}` : template;
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceExplanationDescription = useCallback(
    (problemIndex: number, choiceIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const current = [...(prob.choiceExplanationDescriptions || [])];
      current[choiceIndex] = value;
      updateProblem(problemIndex, { choiceExplanationDescriptions: current });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceExplanationFormulas
        ? prob.choiceExplanationFormulas.map((arr) => [...arr])
        : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      allFormulas[choiceIndex] = [...(allFormulas[choiceIndex] || []), ''];
      updateProblem(problemIndex, { choiceExplanationFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceExplanationFormulas
        ? prob.choiceExplanationFormulas.map((arr) => [...arr])
        : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = [...(allFormulas[choiceIndex] || [])];
      choiceForms[formulaIndex] = value;
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceExplanationFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoiceExplanationFormula = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceExplanationFormulas
        ? prob.choiceExplanationFormulas.map((arr) => [...arr])
        : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = (allFormulas[choiceIndex] || []).filter((_, i) => i !== formulaIndex);
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceExplanationFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleInsertChoiceExplanationSymbol = useCallback(
    (problemIndex: number, choiceIndex: number, formulaIndex: number, symbol: string) => {
      const prob = data.problems[problemIndex];
      const allFormulas = prob.choiceExplanationFormulas
        ? prob.choiceExplanationFormulas.map((arr) => [...arr])
        : [];
      while (allFormulas.length <= choiceIndex) allFormulas.push([]);
      const choiceForms = [...(allFormulas[choiceIndex] || [])];
      const currentText = choiceForms[formulaIndex] || '';
      choiceForms[formulaIndex] = currentText ? `${currentText} ${symbol}` : symbol;
      allFormulas[choiceIndex] = choiceForms;
      updateProblem(problemIndex, { choiceExplanationFormulas: allFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceExplanationErds
        ? prob.choiceExplanationErds.map((arr) => [...arr])
        : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      allErds[choiceIndex] = [...(allErds[choiceIndex] || []), ''];
      updateProblem(problemIndex, { choiceExplanationErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleChangeChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, value: string) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceExplanationErds
        ? prob.choiceExplanationErds.map((arr) => [...arr])
        : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = [...(allErds[choiceIndex] || [])];
      choiceErdsList[erdIndex] = value;
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceExplanationErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoiceExplanationErd = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceExplanationErds
        ? prob.choiceExplanationErds.map((arr) => [...arr])
        : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = (allErds[choiceIndex] || []).filter((_, i) => i !== erdIndex);
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceExplanationErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const handleInsertChoiceExplanationErdTemplate = useCallback(
    (problemIndex: number, choiceIndex: number, erdIndex: number, template: string) => {
      const prob = data.problems[problemIndex];
      const allErds = prob.choiceExplanationErds
        ? prob.choiceExplanationErds.map((arr) => [...arr])
        : [];
      while (allErds.length <= choiceIndex) allErds.push([]);
      const choiceErdsList = [...(allErds[choiceIndex] || [])];
      const currentText = choiceErdsList[erdIndex] || '';
      choiceErdsList[erdIndex] = currentText ? `${currentText}\n${template}` : template;
      allErds[choiceIndex] = choiceErdsList;
      updateProblem(problemIndex, { choiceExplanationErds: allErds });
    },
    [data.problems, updateProblem]
  );

  const activeProblemIndex = Math.min(currentIndex, Math.max(0, data.problems.length - 1));
  const activeProblem =
    data.problems[activeProblemIndex] || data.problems[0] || createEmptyProblem();

  const handleOpenBulkDialog = useCallback(() => {
    const currentChoices = activeProblem?.choices || [];
    setBulkText(currentChoices.filter(Boolean).join('\n'));
    setBulkDialogOpen(true);
  }, [activeProblem?.choices]);

  const handleApplyBulk = useCallback(() => {
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\s*(?:\d+[.)]|\(\d+\)|[①-⑮])\s*/, ''));

    const currentChoices = activeProblem?.choices || [];
    const newChoices = currentChoices.map((existing, i) => (i < lines.length ? lines[i] : ''));

    updateProblem(activeProblemIndex, { choices: newChoices });
    setBulkDialogOpen(false);
    toast.success('선택지가 일괄 적용되었습니다.');
  }, [bulkText, activeProblem?.choices, updateProblem, activeProblemIndex]);

  const handleOpenProblemBulkDialog = useCallback(() => {
    const question = activeProblem?.question || '';
    const currentChoices = activeProblem?.choices || [];
    const lines = [question, ...currentChoices].filter(Boolean);
    setProblemBulkText(lines.join('\n'));
    setProblemBulkDialogOpen(true);
  }, [activeProblem?.question, activeProblem?.choices]);

  const handleApplyProblemBulk = useCallback(() => {
    const lines = problemBulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\s*(?:\d+[.)]|\(\d+\)|[①-⑮])\s*/, ''));

    const newQuestion = lines[0] || '';
    const choiceLines = lines.slice(1);

    const currentChoices = activeProblem?.choices || [];
    const targetLength = Math.max(currentChoices.length, choiceLines.length);
    const newChoices = Array.from({ length: targetLength }, (_, i) =>
      i < choiceLines.length ? choiceLines[i] : currentChoices[i] || ''
    );

    const currentExplanations = activeProblem?.choiceExplanations || [];
    const newExplanations = newChoices.map((_, i) => currentExplanations[i] || '');

    updateProblem(activeProblemIndex, {
      question: newQuestion,
      choices: newChoices,
      choiceExplanations: newExplanations,
    });
    setProblemBulkDialogOpen(false);
    toast.success('문제 및 선택지가 일괄 적용되었습니다.');
  }, [
    problemBulkText,
    activeProblem?.choices,
    activeProblem?.choiceExplanations,
    updateProblem,
    activeProblemIndex,
  ]);

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

  const hasUnsavedChanges = Boolean(
    initialDataRef.current && JSON.stringify(data) !== initialDataRef.current
  );

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
    handleChangeChoiceExplanationDescription,
    handleAddChoiceExplanationFormula,
    handleChangeChoiceExplanationFormula,
    handleRemoveChoiceExplanationFormula,
    handleInsertChoiceExplanationSymbol,
    handleAddChoiceExplanationErd,
    handleChangeChoiceExplanationErd,
    handleRemoveChoiceExplanationErd,
    handleInsertChoiceExplanationErdTemplate,
    handleOpenBulkDialog,
    handleApplyBulk,
    handleOpenProblemBulkDialog,
    handleApplyProblemBulk,
  };
}
