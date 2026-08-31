'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';

import {
  useProblemSetView,
  ProblemSetViewCard,
  ProblemSetPagination,
} from '../components/problem-set';

// ----------------------------------------------------------------------

interface Props {
  fileId: string;
  fileName: string;
  onBack: () => void;
  onEdit: (problemIndex?: number) => void;
  initialProblemIndex?: number;
}

export function ProblemSetView({
  fileId,
  fileName,
  onBack,
  onEdit,
  initialProblemIndex = 0,
}: Props) {
  const {
    data,
    loading,
    currentIndex,
    pageInput,
    selectedAnswers,
    submittedAnswers,
    revealedAnswers,
    showAllAnswers,
    handlePrevProblem,
    handleNextProblem,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
    handleSelectAnswer,
    handleSubmitAnswer,
    handleRevealAnswer,
    handleToggleAllAnswers,
    handleCopyProblem,
  } = useProblemSetView({
    fileId,
    initialProblemIndex,
    onEdit,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!data || data.problems.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={onBack} sx={{ bgcolor: 'background.neutral' }}>
            <ArrowBackIosIcon sx={{ width: 16, height: 16, ml: 0.5 }} />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800 }}>
            {fileName}
          </Typography>
        </Box>
        <Box
          sx={{
            py: 10,
            textAlign: 'center',
            bgcolor: 'background.neutral',
            borderRadius: 2,
          }}
        >
          <DescriptionRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.disabled', mb: 3 }}>
            등록된 문제가 없습니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => onEdit(0)}
          >
            문제 등록하기
          </Button>
        </Box>
      </Container>
    );
  }

  const activeProblem = data.problems[currentIndex] || data.problems[0];
  const pIndex = currentIndex;
  const isRevealed = showAllAnswers
    ? revealedAnswers[pIndex] !== false
    : Boolean(revealedAnswers[pIndex]);

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
      {/* Header */}
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
          {fileName}
        </Typography>

        {/* Header Pagination Controls */}
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

        {/* 정답 ON/OFF Toggle Button */}
        <Tooltip title={showAllAnswers ? '정답 전체 숨기기' : '정답 전체 보기 (자동 표시)'}>
          <Button
            variant={showAllAnswers ? 'contained' : 'outlined'}
            color={showAllAnswers ? 'primary' : 'inherit'}
            onClick={handleToggleAllAnswers}
            startIcon={showAllAnswers ? <VisibilityIcon /> : <VisibilityOffIcon />}
            sx={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              ...(showAllAnswers && {
                boxShadow: (t) => t.customShadows?.primary,
              }),
            }}
          >
            {showAllAnswers ? '정답 ON' : '정답 OFF'}
          </Button>
        </Tooltip>

        <Tooltip title="Copy (Ctrl + B)">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCopyProblem}
            startIcon={<ContentCopyIcon />}
            sx={{ mr: 1 }}
          >
            복사
          </Button>
        </Tooltip>

        <Tooltip title="Edit (Ctrl + E)">
          <Button
            variant="contained"
            color="warning"
            onClick={() => onEdit(currentIndex)}
            startIcon={<EditIcon />}
            sx={{ boxShadow: (t) => t.customShadows?.warning }}
          >
            편집
          </Button>
        </Tooltip>
      </Box>

      {/* Main Problem View Card */}
      <ProblemSetViewCard
        problem={activeProblem}
        problemIndex={pIndex}
        isSubmitted={Boolean(submittedAnswers[pIndex])}
        isRevealed={isRevealed}
        userSelections={selectedAnswers[pIndex] || []}
        onSelectAnswer={(choiceNum, isMultiple) =>
          handleSelectAnswer(pIndex, choiceNum, isMultiple)
        }
        onSubmitAnswer={() => handleSubmitAnswer(pIndex)}
        onRevealAnswer={() => handleRevealAnswer(pIndex)}
      />

      {/* Footer Navigation */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      </Box>
    </Container>
  );
}
