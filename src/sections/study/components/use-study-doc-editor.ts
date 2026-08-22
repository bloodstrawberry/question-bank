'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { toast } from 'src/components/snackbar';
import { getStudyFileScript, saveStudyFileScript } from 'src/api/indexDB';

import {
  type StudyDocData,
  type StudyConcept,
  type StudyBlockType,
  createEmptyConcept,
  createEmptyBlock,
  createDefaultStudyDoc,
} from '../types';

// ----------------------------------------------------------------------

interface UseStudyDocEditorProps {
  fileId: string;
  initialConceptIndex?: number;
  onSaveSuccess?: (conceptIndex?: number) => void;
  onSave?: (fileId: string) => void;
}

export function useStudyDocEditor({
  fileId,
  initialConceptIndex = 0,
  onSaveSuccess,
  onSave,
}: UseStudyDocEditorProps) {
  const [data, setData] = useState<StudyDocData>({ concepts: [] });
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialConceptIndex);
  const [pageInput, setPageInput] = useState(String(initialConceptIndex + 1));
  const [hashtagInput, setHashtagInput] = useState<Record<number, string>>({});
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const initialLoadDone = useRef(false);

  // Load from dedicated Study IndexedDB ('study-db')
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const script = await getStudyFileScript(fileId);

        if (isMounted) {
          if (script && Array.isArray(script.concepts) && script.concepts.length > 0) {
            setData(script);
          } else {
            setData(createDefaultStudyDoc());
          }
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error('Failed to load study script', err);
        if (isMounted) {
          setData(createDefaultStudyDoc());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  // Sync currentIndex to pageInput
  useEffect(() => {
    setPageInput(String(currentIndex + 1));
  }, [currentIndex]);

  const activeConceptIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, data.concepts.length - 1)
  );
  const activeConcept: StudyConcept = data.concepts[activeConceptIndex] || createEmptyConcept();

  // Navigation handlers
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

  // Concept modification
  const updateConcept = useCallback((index: number, updates: Partial<StudyConcept>) => {
    setData((prev) => {
      const nextConcepts = [...prev.concepts];
      if (nextConcepts[index]) {
        nextConcepts[index] = { ...nextConcepts[index], ...updates };
      }
      return { ...prev, concepts: nextConcepts };
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleAddConcept = useCallback(() => {
    const newConcept = createEmptyConcept();
    setData((prev) => ({
      ...prev,
      concepts: [...prev.concepts, newConcept],
    }));
    setHasUnsavedChanges(true);
    setCurrentIndex(data.concepts.length);
    toast.success('새 개념이 추가되었습니다.');
  }, [data.concepts.length]);

  const handleDuplicateConcept = useCallback((index: number) => {
    setData((prev) => {
      const source = prev.concepts[index];
      if (!source) return prev;

      const duplicated: StudyConcept = {
        ...JSON.parse(JSON.stringify(source)),
        id: `concept_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        title: `${source.title || '개념'} (복사본)`,
      };

      const nextConcepts = [...prev.concepts];
      nextConcepts.splice(index + 1, 0, duplicated);
      return { ...prev, concepts: nextConcepts };
    });
    setHasUnsavedChanges(true);
    setCurrentIndex(index + 1);
    toast.success('개념이 복제되었습니다.');
  }, []);

  const handleRemoveConcept = useCallback((index: number) => {
    setDeleteConfirmIndex(index);
  }, []);

  const handleConfirmRemoveConcept = useCallback(() => {
    if (deleteConfirmIndex === null) return;
    const index = deleteConfirmIndex;

    setData((prev) => {
      const nextConcepts = prev.concepts.filter((_, i) => i !== index);
      return { ...prev, concepts: nextConcepts.length > 0 ? nextConcepts : [createEmptyConcept()] };
    });
    setHasUnsavedChanges(true);
    setCurrentIndex((prev) => Math.max(0, Math.min(prev, data.concepts.length - 2)));
    setDeleteConfirmIndex(null);
    toast.success('개념이 삭제되었습니다.');
  }, [deleteConfirmIndex, data.concepts.length]);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmIndex(null);
  }, []);

  // Title & Hashtags
  const handleUpdateTitle = useCallback(
    (title: string) => {
      updateConcept(activeConceptIndex, { title });
    },
    [activeConceptIndex, updateConcept]
  );

  const handleAddHashtag = useCallback(
    (tag: string) => {
      const cleanTag = tag.trim().replace(/^#/, '');
      if (!cleanTag) return;

      const currentTags = activeConcept.hashtags || [];
      if (!currentTags.includes(cleanTag)) {
        updateConcept(activeConceptIndex, { hashtags: [...currentTags, cleanTag] });
      }
      setHashtagInput((prev) => ({ ...prev, [activeConceptIndex]: '' }));
    },
    [activeConcept.hashtags, activeConceptIndex, updateConcept]
  );

  const handleRemoveHashtag = useCallback(
    (tagIndex: number) => {
      const currentTags = activeConcept.hashtags || [];
      const updated = currentTags.filter((_, i) => i !== tagIndex);
      updateConcept(activeConceptIndex, { hashtags: updated });
    },
    [activeConcept.hashtags, activeConceptIndex, updateConcept]
  );

  // Content Blocks
  const handleAddBlock = useCallback(
    (type: StudyBlockType) => {
      const newBlock = createEmptyBlock(type);
      const currentBlocks = activeConcept.blocks || [];
      updateConcept(activeConceptIndex, {
        blocks: [...currentBlocks, newBlock],
      });
      toast.success(`${type} 블록이 추가되었습니다.`);
    },
    [activeConcept.blocks, activeConceptIndex, updateConcept]
  );

  const handleChangeBlockContent = useCallback(
    (blockIndex: number, content: string) => {
      const currentBlocks = [...(activeConcept.blocks || [])];
      if (currentBlocks[blockIndex]) {
        currentBlocks[blockIndex] = { ...currentBlocks[blockIndex], content };
        updateConcept(activeConceptIndex, { blocks: currentBlocks });
      }
    },
    [activeConcept.blocks, activeConceptIndex, updateConcept]
  );

  const handleMoveBlockUp = useCallback(
    (blockIndex: number) => {
      if (blockIndex <= 0) return;
      const currentBlocks = [...(activeConcept.blocks || [])];
      const temp = currentBlocks[blockIndex - 1];
      currentBlocks[blockIndex - 1] = currentBlocks[blockIndex];
      currentBlocks[blockIndex] = temp;
      updateConcept(activeConceptIndex, { blocks: currentBlocks });
    },
    [activeConcept.blocks, activeConceptIndex, updateConcept]
  );

  const handleMoveBlockDown = useCallback(
    (blockIndex: number) => {
      const currentBlocks = [...(activeConcept.blocks || [])];
      if (blockIndex >= currentBlocks.length - 1) return;
      const temp = currentBlocks[blockIndex + 1];
      currentBlocks[blockIndex + 1] = currentBlocks[blockIndex];
      currentBlocks[blockIndex] = temp;
      updateConcept(activeConceptIndex, { blocks: currentBlocks });
    },
    [activeConcept.blocks, activeConceptIndex, updateConcept]
  );

  const handleDeleteBlock = useCallback(
    (blockIndex: number) => {
      const currentBlocks = [...(activeConcept.blocks || [])];
      currentBlocks.splice(blockIndex, 1);
      updateConcept(activeConceptIndex, { blocks: currentBlocks });
    },
    [activeConcept.blocks, activeConceptIndex, updateConcept]
  );

  // Reorder Concepts
  const handleOpenReorderDialog = useCallback(() => {
    setReorderDialogOpen(true);
  }, []);

  const handleApplyReorderConcepts = useCallback(
    (newConcepts: StudyConcept[], newActiveIndex: number) => {
      setData((prev) => ({ ...prev, concepts: newConcepts }));
      setCurrentIndex(newActiveIndex);
      setHasUnsavedChanges(true);
      toast.success('개념 순서가 변경되었습니다.');
    },
    []
  );

  // Save
  const handleSave = useCallback(
    async (silent = false): Promise<boolean> => {
      try {
        await saveStudyFileScript(fileId, data);
        setHasUnsavedChanges(false);
        if (!silent) {
          toast.success('저장되었습니다.');
        }
        onSaveSuccess?.(currentIndex);
        onSave?.(fileId);
        return true;
      } catch (err) {
        console.error('Failed to save study script', err);
        toast.error('저장에 실패했습니다.');
        return false;
      }
    },
    [fileId, data, currentIndex, onSaveSuccess, onSave]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when inside inputs/textareas
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      const isEditing =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handleAddConcept();
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
  }, [handleSave, handleAddConcept, handlePrevConcept, handleNextConcept]);

  return {
    data,
    loading,
    hasUnsavedChanges,
    currentIndex,
    activeConceptIndex,
    activeConcept,
    pageInput,
    hashtagInput,
    setHashtagInput,
    reorderDialogOpen,
    setReorderDialogOpen,
    deleteConfirmIndex,
    handlePrevConcept,
    handleNextConcept,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
    handleAddConcept,
    updateConcept,
    handleDuplicateConcept,
    handleRemoveConcept,
    handleConfirmRemoveConcept,
    handleCloseDeleteConfirm,
    handleUpdateTitle,
    handleAddHashtag,
    handleRemoveHashtag,
    handleAddBlock,
    handleChangeBlockContent,
    handleMoveBlockUp,
    handleMoveBlockDown,
    handleDeleteBlock,
    handleOpenReorderDialog,
    handleApplyReorderConcepts,
    handleSave,
  };
}
