'use client';

import { useState, useEffect, useCallback } from 'react';

import { getStudyFileScript } from 'src/api/indexDB';
import type { StudyDocData } from '../types';

// ----------------------------------------------------------------------

interface UseStudyDocViewProps {
  fileId: string;
  initialConceptIndex?: number;
  onEdit?: (conceptIndex?: number) => void;
}

export function useStudyDocView({ fileId, initialConceptIndex = 0, onEdit }: UseStudyDocViewProps) {
  const [data, setData] = useState<StudyDocData>({ concepts: [] });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialConceptIndex);
  const [pageInput, setPageInput] = useState(String(initialConceptIndex + 1));

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const script = await getStudyFileScript(fileId);
        if (isMounted) {
          if (script && Array.isArray(script.concepts)) {
            setData(script);
          } else {
            setData({ concepts: [] });
          }
        }
      } catch (err) {
        console.error('Failed to load study script', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  useEffect(() => {
    setPageInput(String(currentIndex + 1));
  }, [currentIndex]);

  const handlePrevConcept = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNextConcept = useCallback(() => {
    if (currentIndex < data.concepts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, data.concepts.length]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= data.concepts.length) {
      setCurrentIndex(num - 1);
    } else {
      setPageInput(String(currentIndex + 1));
    }
  }, [pageInput, data.concepts.length, currentIndex]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePageInputBlur();
      }
    },
    [handlePageInputBlur]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      const isEditing = activeTag === 'input' || activeTag === 'textarea';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onEdit?.(currentIndex);
        return;
      }

      if (!isEditing) {
        if (e.shiftKey && e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevConcept();
        } else if (e.shiftKey && e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextConcept();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEdit, currentIndex, handlePrevConcept, handleNextConcept]);

  return {
    data,
    loading,
    currentIndex,
    pageInput,
    handlePrevConcept,
    handleNextConcept,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
  };
}
