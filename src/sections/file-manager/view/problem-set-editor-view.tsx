'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import Container from '@mui/material/Container';
import SaveIcon from '@mui/icons-material/Save';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import {
  ProblemEditorCard,
  useProblemSetEditor,
  ProblemSetPagination,
  ProblemEditorBulkDialog,
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
    handleAddChoice,
    handleRemoveChoice,
    handleChangeChoice,
    handleChangeChoiceExplanation,
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
        <IconButton onClick={onBack} sx={{ bgcolor: 'background.neutral' }}>
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
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{ boxShadow: (t) => t.customShadows?.primary }}
          >
            Save
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
        onAddChoice={() => handleAddChoice(activeProblemIndex)}
        onRemoveChoice={(cIdx) => handleRemoveChoice(activeProblemIndex, cIdx)}
        onChangeChoice={(cIdx, val) => handleChangeChoice(activeProblemIndex, cIdx, val)}
        onChangeChoiceExplanation={(cIdx, val) =>
          handleChangeChoiceExplanation(activeProblemIndex, cIdx, val)
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

      {/* Footer Save Button */}
      <Box sx={{ mt: 6, pb: 10, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Save (Ctrl + S)">
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={handleSave}
            sx={{
              px: 8,
              height: 56,
              borderRadius: 2,
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
        onBulkTextChange={setBulkText}
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
        onBulkTextChange={setProblemBulkText}
        onApplyBulk={handleApplyProblemBulk}
      />
    </Container>
  );
}
