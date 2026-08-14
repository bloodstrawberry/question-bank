import type { ProblemSetData } from './types';

import { useState, useEffect, useCallback } from 'react';

import { getFileScript } from 'src/api/indexDB';

interface UseProblemSetViewOptions {
  fileId: string;
  initialProblemIndex?: number;
  onEdit: (problemIndex?: number) => void;
}

export function useProblemSetView({
  fileId,
  initialProblemIndex = 0,
  onEdit,
}: UseProblemSetViewOptions) {
  const [data, setData] = useState<ProblemSetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialProblemIndex);
  const [pageInput, setPageInput] = useState(String(initialProblemIndex + 1));
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadScript = async () => {
      setLoading(true);
      const startIdx = initialProblemIndex ?? 0;
      setCurrentIndex(startIdx);
      setPageInput(String(startIdx + 1));
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setRevealedAnswers({});
      try {
        const saved = await getFileScript(fileId);
        if (saved?.problems && saved.problems.length > 0) {
          setData(saved as ProblemSetData);
          const validIndex = Math.min(Math.max(0, startIdx), saved.problems.length - 1);
          setCurrentIndex(validIndex);
          setPageInput(String(validIndex + 1));
        } else {
          setData(null);
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
    setPageInput(String(currentIndex + 1));
  }, [currentIndex]);

  const handlePrevProblem = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextProblem = useCallback(() => {
    if (!data) return;
    setCurrentIndex((prev) => Math.min(data.problems.length - 1, prev + 1));
  }, [data]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPageInput(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && data && num <= data.problems.length) {
        setCurrentIndex(num - 1);
      }
    },
    [data]
  );

  const handlePageInputBlur = useCallback(() => {
    if (!data) return;
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
  }, [data, pageInput]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePageInputBlur();
      }
    },
    [handlePageInputBlur]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        onEdit(currentIndex);
        return;
      }

      if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
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
  }, [data?.problems, onEdit, currentIndex]);

  const handleSelectAnswer = useCallback(
    (problemIndex: number, choiceNum: number, isMultiple: boolean) => {
      setSubmittedAnswers((prev) => {
        if (prev[problemIndex]) return prev;
        setSelectedAnswers((s) => {
          const current = s[problemIndex] || [];
          if (isMultiple) {
            const updated = current.includes(choiceNum)
              ? current.filter((n) => n !== choiceNum)
              : [...current, choiceNum].sort((a, b) => a - b);
            return { ...s, [problemIndex]: updated };
          }
          return { ...s, [problemIndex]: [choiceNum] };
        });
        return prev;
      });
    },
    []
  );

  const handleSubmitAnswer = useCallback(
    (problemIndex: number) => {
      if (!data) return;
      const selected = selectedAnswers[problemIndex];
      if (!selected || selected.length === 0) return;

      setSubmittedAnswers((prev) => ({ ...prev, [problemIndex]: true }));
      setRevealedAnswers((prev) => ({ ...prev, [problemIndex]: true }));
    },
    [data, selectedAnswers]
  );

  const handleRevealAnswer = useCallback((problemIndex: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [problemIndex]: !prev[problemIndex] }));
  }, []);

  return {
    data,
    loading,
    currentIndex,
    pageInput,
    selectedAnswers,
    submittedAnswers,
    revealedAnswers,
    handlePrevProblem,
    handleNextProblem,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
    handleSelectAnswer,
    handleSubmitAnswer,
    handleRevealAnswer,
  };
}
