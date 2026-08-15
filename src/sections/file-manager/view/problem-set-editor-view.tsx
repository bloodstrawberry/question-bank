'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

import {
  ProblemEditorCard,
  useProblemSetEditor,
  ProblemSetPagination,
  ProblemEditorBulkDialog,
  ProblemEditorReorderDialog,
  ProblemEditorNoAnswerDialog,
} from '../components/problem-set';

// ----------------------------------------------------------------------

interface Props {
  fileId: string;
  fileName: string;
  onBack: () => void;
  onSaveSuccess: (problemIndex?: number) => void;
  onSave?: (fileId: string) => void;
  initialProblemIndex?: number;
}

export function ProblemSetEditorView({
  fileId,
  fileName,
  onBack,
  onSaveSuccess,
  onSave,
  initialProblemIndex = 0,
}: Props) {
  const {
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
  } = useProblemSetEditor({
    fileId,
    initialProblemIndex,
    onSaveSuccess,
    onSave,
  });

  const [exitConfirmDialogOpen, setExitConfirmDialogOpen] = useState(false);

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

  const pendingExitRef = useRef(false);

  const isAnyDialogOpen =
    bulkDialogOpen ||
    problemBulkDialogOpen ||
    reorderDialogOpen ||
    exitConfirmDialogOpen ||
    noAnswerWarningOpen;

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
        <ProblemSetPagination
          variant="header"
          currentIndex={currentIndex}
          totalProblems={data.problems.length}
          pageInput={pageInput}
          onPrev={handlePrevProblem}
          onNext={handleNextProblem}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
        />

        <Tooltip title="문제 순서 변경">
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

        <Tooltip title="문제 추가 (Ctrl + Q)">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddProblem}
            startIcon={<AddIcon />}
            sx={{ fontWeight: 700 }}
          >
            문제 추가
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

      {/* Main Problem Card Editor */}
      <ProblemEditorCard
        problem={activeProblem}
        problemIndex={activeProblemIndex}
        totalProblems={data.problems.length}
        hashtagInput={hashtagInput[activeProblemIndex] || ''}
        onHashtagInputChange={(val) =>
          setHashtagInput((prev) => ({ ...prev, [activeProblemIndex]: val }))
        }
        onUpdateProblem={(updates) => updateProblem(activeProblemIndex, updates)}
        onDuplicateProblem={handleDuplicateProblem}
        onRemoveProblem={handleRemoveProblem}
        onAddHashtag={(tag) => handleAddHashtag(activeProblemIndex, tag)}
        onRemoveHashtag={(tagIdx) => handleRemoveHashtag(activeProblemIndex, tagIdx)}
        onAddFormula={() => handleAddFormula(activeProblemIndex)}
        onChangeFormula={(fIdx, val) => handleChangeFormula(activeProblemIndex, fIdx, val)}
        onRemoveFormula={(fIdx) => handleRemoveFormula(activeProblemIndex, fIdx)}
        onInsertSymbol={(fIdx, sym) => handleInsertSymbol(activeProblemIndex, fIdx, sym)}
        onAddExplanationFormula={() => handleAddExplanationFormula(activeProblemIndex)}
        onChangeExplanationFormula={(fIdx, val) =>
          handleChangeExplanationFormula(activeProblemIndex, fIdx, val)
        }
        onRemoveExplanationFormula={(fIdx) =>
          handleRemoveExplanationFormula(activeProblemIndex, fIdx)
        }
        onInsertExplanationSymbol={(fIdx, sym) =>
          handleInsertExplanationSymbol(activeProblemIndex, fIdx, sym)
        }
        onAddErd={() => handleAddErd(activeProblemIndex)}
        onChangeErd={(erdIdx, val) => handleChangeErd(activeProblemIndex, erdIdx, val)}
        onRemoveErd={(erdIdx) => handleRemoveErd(activeProblemIndex, erdIdx)}
        onInsertErdTemplate={(erdIdx, tmpl) =>
          handleInsertErdTemplate(activeProblemIndex, erdIdx, tmpl)
        }
        onAddExplanationErd={() => handleAddExplanationErd(activeProblemIndex)}
        onChangeExplanationErd={(erdIdx, val) =>
          handleChangeExplanationErd(activeProblemIndex, erdIdx, val)
        }
        onRemoveExplanationErd={(erdIdx) => handleRemoveExplanationErd(activeProblemIndex, erdIdx)}
        onInsertExplanationErdTemplate={(erdIdx, tmpl) =>
          handleInsertExplanationErdTemplate(activeProblemIndex, erdIdx, tmpl)
        }
        onAddChart={() => handleAddChart(activeProblemIndex)}
        onChangeChart={(chartIdx, val) => handleChangeChart(activeProblemIndex, chartIdx, val)}
        onRemoveChart={(chartIdx) => handleRemoveChart(activeProblemIndex, chartIdx)}
        onInsertChartTemplate={(chartIdx, tmpl) =>
          handleInsertChartTemplate(activeProblemIndex, chartIdx, tmpl)
        }
        onAddExplanationChart={() => handleAddExplanationChart(activeProblemIndex)}
        onChangeExplanationChart={(chartIdx, val) =>
          handleChangeExplanationChart(activeProblemIndex, chartIdx, val)
        }
        onRemoveExplanationChart={(chartIdx) =>
          handleRemoveExplanationChart(activeProblemIndex, chartIdx)
        }
        onInsertExplanationChartTemplate={(chartIdx, tmpl) =>
          handleInsertExplanationChartTemplate(activeProblemIndex, chartIdx, tmpl)
        }
        onAddChoice={() => handleAddChoice(activeProblemIndex)}
        onRemoveChoice={(cIdx) => handleRemoveChoice(activeProblemIndex, cIdx)}
        onReorderChoice={(oldIdx, newIdx) =>
          handleReorderChoices(activeProblemIndex, oldIdx, newIdx)
        }
        onChangeChoice={(cIdx, val) => handleChangeChoice(activeProblemIndex, cIdx, val)}
        onChangeChoiceDescription={(cIdx, val) =>
          handleChangeChoiceDescription(activeProblemIndex, cIdx, val)
        }
        onAddChoiceFormula={(cIdx) => handleAddChoiceFormula(activeProblemIndex, cIdx)}
        onChangeChoiceFormula={(cIdx, fIdx, val) =>
          handleChangeChoiceFormula(activeProblemIndex, cIdx, fIdx, val)
        }
        onRemoveChoiceFormula={(cIdx, fIdx) =>
          handleRemoveChoiceFormula(activeProblemIndex, cIdx, fIdx)
        }
        onInsertChoiceSymbol={(cIdx, fIdx, sym) =>
          handleInsertChoiceSymbol(activeProblemIndex, cIdx, fIdx, sym)
        }
        onAddChoiceErd={(cIdx) => handleAddChoiceErd(activeProblemIndex, cIdx)}
        onChangeChoiceErd={(cIdx, erdIdx, val) =>
          handleChangeChoiceErd(activeProblemIndex, cIdx, erdIdx, val)
        }
        onRemoveChoiceErd={(cIdx, erdIdx) =>
          handleRemoveChoiceErd(activeProblemIndex, cIdx, erdIdx)
        }
        onInsertChoiceErdTemplate={(cIdx, erdIdx, tmpl) =>
          handleInsertChoiceErdTemplate(activeProblemIndex, cIdx, erdIdx, tmpl)
        }
        onAddChoiceChart={(cIdx) => handleAddChoiceChart(activeProblemIndex, cIdx)}
        onChangeChoiceChart={(cIdx, chartIdx, val) =>
          handleChangeChoiceChart(activeProblemIndex, cIdx, chartIdx, val)
        }
        onRemoveChoiceChart={(cIdx, chartIdx) =>
          handleRemoveChoiceChart(activeProblemIndex, cIdx, chartIdx)
        }
        onInsertChoiceChartTemplate={(cIdx, chartIdx, tmpl) =>
          handleInsertChoiceChartTemplate(activeProblemIndex, cIdx, chartIdx, tmpl)
        }
        onChangeChoiceExplanation={(cIdx, val) =>
          handleChangeChoiceExplanation(activeProblemIndex, cIdx, val)
        }
        onChangeChoiceExplanationDescription={(cIdx, val) =>
          handleChangeChoiceExplanationDescription(activeProblemIndex, cIdx, val)
        }
        onAddChoiceExplanationFormula={(cIdx) =>
          handleAddChoiceExplanationFormula(activeProblemIndex, cIdx)
        }
        onChangeChoiceExplanationFormula={(cIdx, fIdx, val) =>
          handleChangeChoiceExplanationFormula(activeProblemIndex, cIdx, fIdx, val)
        }
        onRemoveChoiceExplanationFormula={(cIdx, fIdx) =>
          handleRemoveChoiceExplanationFormula(activeProblemIndex, cIdx, fIdx)
        }
        onInsertChoiceExplanationSymbol={(cIdx, fIdx, sym) =>
          handleInsertChoiceExplanationSymbol(activeProblemIndex, cIdx, fIdx, sym)
        }
        onAddChoiceExplanationErd={(cIdx) =>
          handleAddChoiceExplanationErd(activeProblemIndex, cIdx)
        }
        onChangeChoiceExplanationErd={(cIdx, erdIdx, val) =>
          handleChangeChoiceExplanationErd(activeProblemIndex, cIdx, erdIdx, val)
        }
        onRemoveChoiceExplanationErd={(cIdx, erdIdx) =>
          handleRemoveChoiceExplanationErd(activeProblemIndex, cIdx, erdIdx)
        }
        onInsertChoiceExplanationErdTemplate={(cIdx, erdIdx, tmpl) =>
          handleInsertChoiceExplanationErdTemplate(activeProblemIndex, cIdx, erdIdx, tmpl)
        }
        onAddChoiceExplanationChart={(cIdx) =>
          handleAddChoiceExplanationChart(activeProblemIndex, cIdx)
        }
        onChangeChoiceExplanationChart={(cIdx, chartIdx, val) =>
          handleChangeChoiceExplanationChart(activeProblemIndex, cIdx, chartIdx, val)
        }
        onRemoveChoiceExplanationChart={(cIdx, chartIdx) =>
          handleRemoveChoiceExplanationChart(activeProblemIndex, cIdx, chartIdx)
        }
        onInsertChoiceExplanationChartTemplate={(cIdx, chartIdx, tmpl) =>
          handleInsertChoiceExplanationChartTemplate(activeProblemIndex, cIdx, chartIdx, tmpl)
        }
        onOpenBulkDialog={handleOpenBulkDialog}
        onOpenProblemBulkDialog={handleOpenProblemBulkDialog}
      />

      {/* Bottom Navigation Controls */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <ProblemSetPagination
          variant="footer"
          currentIndex={currentIndex}
          totalProblems={data.problems.length}
          pageInput={pageInput}
          onPrev={handlePrevProblem}
          onNext={handleNextProblem}
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
            onClick={handleAddProblem}
            variant="outlined"
            color="primary"
            sx={{
              py: 1,
              px: 3,
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          >
            문제 추가
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

      {/* Bulk Edit Choice Dialog */}
      <ProblemEditorBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        choicesCount={activeProblem.choices.length}
        bulkText={bulkText}
        onApplyBulk={handleApplyBulk}
      />

      {/* Bulk Edit Problem & Choices Dialog */}
      <ProblemEditorBulkDialog
        open={problemBulkDialogOpen}
        onClose={() => setProblemBulkDialogOpen(false)}
        title="문제 및 선택지 일괄 입력 (Bulk Edit)"
        description="첫 줄은 문제로 입력되고, 두 번째 줄부터는 객관식 선택지로 입력됩니다. 앞에 붙은 문제 번호(1., ① 등)와 줄바꿈 공백은 자동으로 정돈됩니다."
        placeholder={`1. 다음 중 옳은 것을 고르시오.\n1) 선택지 A\n2) 선택지 B\n3) 선택지 C\n4) 선택지 D`}
        bulkText={problemBulkText}
        onApplyBulk={handleApplyProblemBulk}
      />
      {/* Problem Set Reorder Dialog */}
      <ProblemEditorReorderDialog
        open={reorderDialogOpen}
        onClose={() => setReorderDialogOpen(false)}
        problems={data.problems}
        activeProblemIndex={activeProblemIndex}
        onApplyReorder={handleApplyReorderProblems}
      />

      {/* Unsaved Changes Exit Confirmation Dialog */}
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

        <DialogActions sx={{ p: 0, mt: 3, gap: 1, flexDirection: 'column' }}>
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
      {/* No Answer Warning Dialog */}
      <ProblemEditorNoAnswerDialog
        open={noAnswerWarningOpen}
        onClose={() => {
          setNoAnswerWarningOpen(false);
          pendingExitRef.current = false;
        }}
        unansweredProblems={unansweredProblems}
        onIgnoreAndSave={async () => {
          setNoAnswerWarningOpen(false);
          const success = await handleSave(true);
          if (success && pendingExitRef.current) {
            pendingExitRef.current = false;
            onBack();
          }
        }}
      />
    </Container>
  );
}
