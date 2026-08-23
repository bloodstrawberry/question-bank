'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ReorderIcon from '@mui/icons-material/Reorder';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import { saveStudyFileScript } from 'src/api/indexDB';

import {
  StudyPagination,
  useStudyDocEditor,
  StudyConceptEditorCard,
  StudyConceptDeleteDialog,
  StudyConceptReorderDialog,
} from '../components';

// ----------------------------------------------------------------------

interface Props {
  fileId: string;
  fileName: string;
  onBack: () => void;
  onSaveSuccess: (conceptIndex?: number) => void;
  onSave?: (fileId: string) => void;
  initialConceptIndex?: number;
}

export function StudyDocEditorView({
  fileId,
  fileName,
  onBack,
  onSaveSuccess,
  onSave,
  initialConceptIndex = 0,
}: Props) {
  const {
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
  } = useStudyDocEditor({
    fileId,
    initialConceptIndex,
    onSaveSuccess,
    onSave,
  });

  const [exitConfirmDialogOpen, setExitConfirmDialogOpen] = useState(false);
  const pendingExitRef = useRef(false);

  const handleExitRequest = useCallback(() => {
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }

    setTimeout(() => {
      if (hasUnsavedChanges) {
        setExitConfirmDialogOpen(true);
      } else {
        onBack();
      }
    }, 50);
  }, [hasUnsavedChanges, onBack]);

  const isAnyDialogOpen = reorderDialogOpen || exitConfirmDialogOpen || deleteConfirmIndex !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAnyDialogOpen) {
        e.preventDefault();
        handleExitRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExitRequest, isAnyDialogOpen]);

  // Browser emergency backup save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        if (data && data.concepts) {
          saveStudyFileScript(fileId, data).catch((err) =>
            console.error('Emergency save on beforeunload failed', err)
          );
        }
        return '';
      }
      return undefined;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        if (data && data.concepts) {
          saveStudyFileScript(fileId, data).catch((err) =>
            console.error('Emergency save on visibilitychange failed', err)
          );
        }
      }
    };

    const handlePageHide = () => {
      if (hasUnsavedChanges && data && data.concepts) {
        saveStudyFileScript(fileId, data).catch((err) =>
          console.error('Emergency save on pagehide failed', err)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (hasUnsavedChanges && data && data.concepts) {
        saveStudyFileScript(fileId, data).catch((err) =>
          console.error('Emergency save on unmount failed', err)
        );
      }
    };
  }, [hasUnsavedChanges, data, fileId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading editor...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
      {/* Sticky Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 10,
          py: 1.5,
          mx: { xs: -2, md: -8 },
          px: { xs: 2, md: 8 },
        }}
      >
        <IconButton
          onClick={handleExitRequest}
          sx={{ bgcolor: 'background.neutral' }}
          title="나가기 (Esc)"
        >
          <ArrowBackIosIcon sx={{ width: 16, height: 16, ml: 0.5 }} />
        </IconButton>

        <Typography
          variant="h5"
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Edit: {fileName}
        </Typography>

        {/* Pagination Header Controls */}
        <StudyPagination
          variant="header"
          currentIndex={currentIndex}
          totalConcepts={data.concepts.length}
          pageInput={pageInput}
          onPrev={handlePrevConcept}
          onNext={handleNextConcept}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
        />

        <Tooltip title="개념 순서 변경">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenReorderDialog}
            startIcon={<ReorderIcon />}
            sx={{ fontWeight: 700 }}
          >
            순서 변경
          </Button>
        </Tooltip>

        <Tooltip title="개념 추가 (Ctrl + Q)">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddConcept}
            startIcon={<AddIcon />}
            sx={{ fontWeight: 700 }}
          >
            개념 추가
          </Button>
        </Tooltip>

        <Tooltip title="Save (Ctrl + S)">
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSave()}
            startIcon={<SaveIcon />}
            sx={{ boxShadow: (t) => t.customShadows?.primary }}
          >
            Save
          </Button>
        </Tooltip>

        <Tooltip title="나가기 (Esc)">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleExitRequest}
            startIcon={<ExitToAppIcon />}
            sx={{ fontWeight: 700 }}
          >
            나가기
          </Button>
        </Tooltip>
      </Box>

      {/* Main Concept Card Editor */}
      <StudyConceptEditorCard
        concept={activeConcept}
        conceptIndex={activeConceptIndex}
        totalConcepts={data.concepts.length}
        hashtagInput={hashtagInput[activeConceptIndex] || ''}
        onHashtagInputChange={(val) =>
          setHashtagInput((prev) => ({ ...prev, [activeConceptIndex]: val }))
        }
        onAddHashtag={handleAddHashtag}
        onRemoveHashtag={handleRemoveHashtag}
        onUpdateTitle={handleUpdateTitle}
        onAddBlock={handleAddBlock}
        onChangeBlockContent={handleChangeBlockContent}
        onMoveBlockUp={handleMoveBlockUp}
        onMoveBlockDown={handleMoveBlockDown}
        onDeleteBlock={handleDeleteBlock}
        onDuplicateConcept={handleDuplicateConcept}
        onRemoveConcept={handleRemoveConcept}
      />

      {/* Bottom Navigation Controls */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <StudyPagination
          variant="footer"
          currentIndex={currentIndex}
          totalConcepts={data.concepts.length}
          pageInput={pageInput}
          onPrev={handlePrevConcept}
          onNext={handleNextConcept}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
        />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            startIcon={<ReorderIcon />}
            onClick={handleOpenReorderDialog}
            variant="outlined"
            color="primary"
            sx={{
              py: 1,
              px: 3,
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          >
            순서 변경
          </Button>

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddConcept}
            variant="outlined"
            color="primary"
            sx={{
              py: 1,
              px: 3,
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          >
            개념 추가
          </Button>
        </Box>
      </Box>

      {/* Footer Save Button */}
      <Box sx={{ mt: 6, pb: 10, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Save (Ctrl + S)">
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={() => handleSave()}
            sx={{
              px: 4,
              height: 48,
              borderRadius: 1.5,
              boxShadow: (t) => t.customShadows?.primary,
            }}
          >
            저장하기
          </Button>
        </Tooltip>
      </Box>

      {/* Concept Reorder Dialog */}
      <StudyConceptReorderDialog
        open={reorderDialogOpen}
        onClose={() => setReorderDialogOpen(false)}
        concepts={data.concepts}
        activeConceptIndex={activeConceptIndex}
        onApplyReorder={handleApplyReorderConcepts}
      />

      {/* Concept Delete Dialog */}
      <StudyConceptDeleteDialog
        open={deleteConfirmIndex !== null}
        onClose={handleCloseDeleteConfirm}
        conceptNumber={(deleteConfirmIndex ?? 0) + 1}
        onConfirmDelete={handleConfirmRemoveConcept}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={exitConfirmDialogOpen}
        onClose={() => setExitConfirmDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            p: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 800, fontSize: 18 }}>
          저장되지 않은 변경 사항
        </DialogTitle>

        <DialogContent sx={{ p: 0, py: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            수정 중인 내용이 있습니다. 저장하고 나가시겠습니까?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 0, mt: 3, gap: 1, display: 'flex', flexDirection: 'column' }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={async () => {
              setExitConfirmDialogOpen(false);
              pendingExitRef.current = true;
              const success = await handleSave();
              if (success) {
                pendingExitRef.current = false;
                onBack();
              }
            }}
            sx={{ fontWeight: 700 }}
          >
            저장하고 나가기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={() => {
              setExitConfirmDialogOpen(false);
              onBack();
            }}
            sx={{ fontWeight: 700 }}
          >
            저장하지 않고 나가기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={() => setExitConfirmDialogOpen(false)}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
