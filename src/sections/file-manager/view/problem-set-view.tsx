'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import { alpha, useTheme } from '@mui/material/styles';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FunctionsIcon from '@mui/icons-material/Functions';

import { getFileScript } from 'src/api/indexDB';
import { KatexMath } from 'src/components/katex';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// ----------------------------------------------------------------------

interface Problem {
  hashtags: string[];
  question: string;
  description: string;
  formulas?: string[];
  formula?: string;
  explanationFormulas?: string[];
  explanationFormula?: string;
  choices: string[];
  answer: number;
  answers?: number[];
  isMultipleAnswer?: boolean;
  showMultipleCount?: boolean;
  explanation: string;
  choiceExplanations: string[];
}

interface ProblemSetData {
  problems: Problem[];
}

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
  const theme = useTheme();

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

  // Keyboard Shortcuts
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

  const problem = data.problems[currentIndex] || data.problems[0];
  const pIndex = currentIndex;
  const problemFormulas = Array.isArray(problem.formulas)
    ? problem.formulas.filter((f) => f && f.trim())
    : problem.formula && problem.formula.trim()
      ? [problem.formula.trim()]
      : [];
  const problemExplanationFormulas = Array.isArray(problem.explanationFormulas)
    ? problem.explanationFormulas.filter((f: string) => f && f.trim())
    : problem.explanationFormula && problem.explanationFormula.trim()
      ? [problem.explanationFormula.trim()]
      : [];
  const isSubmitted = !!submittedAnswers[pIndex];
  const isRevealed = !!revealedAnswers[pIndex];
  const userSelections = selectedAnswers[pIndex] || [];
  const isMultiple = Boolean(problem.isMultipleAnswer);

  const correctAnswersList = isMultiple
    ? (problem.answers || []).slice().sort((a, b) => a - b)
    : problem.answer
      ? [problem.answer]
      : [];

  const isCorrect =
    isSubmitted &&
    (isMultiple
      ? correctAnswersList.length === userSelections.length &&
        correctAnswersList.every(
          (val, idx) => [...userSelections].sort((a, b) => a - b)[idx] === val
        )
      : userSelections[0] === problem.answer);

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

        {/* Pagination Header Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.neutral',
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
          }}
        >
          <Tooltip title="이전 문제 (Shift + ←)">
            <span>
              <IconButton
                size="small"
                onClick={handlePrevProblem}
                disabled={currentIndex === 0}
                sx={{ color: 'text.primary' }}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
              문제
            </Typography>
            <TextField
              size="small"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              slotProps={{
                htmlInput: {
                  style: {
                    textAlign: 'center',
                    padding: '4px 6px',
                    width: '40px',
                    fontWeight: 700,
                  },
                },
              }}
              sx={{
                width: 52,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
              / {data.problems.length}
            </Typography>
          </Box>

          <Tooltip title="다음 문제 (Shift + →)">
            <span>
              <IconButton
                size="small"
                onClick={handleNextProblem}
                disabled={currentIndex === data.problems.length - 1}
                sx={{ color: 'text.primary' }}
              >
                <NavigateNextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

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

      {/* Problem Card */}
      <Card
        key={pIndex}
        sx={{
          p: 3,
          border: (t) => `solid 1px ${t.vars.palette.divider}`,
          ...(isSubmitted && {
            borderColor: isCorrect ? 'success.main' : 'error.main',
            borderWidth: 2,
          }),
        }}
      >
        <Stack spacing={2.5}>
          {/* Problem Number + Hashtags */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  bgcolor: isSubmitted
                    ? isCorrect
                      ? 'success.main'
                      : 'error.main'
                    : 'text.primary',
                  color: 'background.paper',
                }}
              >
                {pIndex + 1}
              </Box>

              {isSubmitted && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: isCorrect ? 'success.main' : 'error.main',
                  }}
                >
                  {isCorrect ? '정답!' : '오답'}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={0.5} justifyContent="flex-end">
              {problem.hashtags.map((tag, tagIndex) => (
                <Chip
                  key={tagIndex}
                  label={tag}
                  size="small"
                  color="primary"
                  variant="soft"
                  sx={{ fontWeight: 600, fontSize: 12 }}
                />
              ))}
            </Stack>
          </Stack>

          {/* Question */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {problem.question}
            </Typography>

            {problem.isMultipleAnswer && problem.showMultipleCount !== false && (
              <Chip
                size="small"
                color="warning"
                variant="soft"
                label={`정답 ${(problem.answers || []).length || 2}개`}
                sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
              />
            )}
          </Box>

          {/* Description */}
          {problem.description &&
            problem.description.trim() &&
            problem.description.trim() !== '<p></p>' && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.06),
                  border: (t) => `1px solid ${alpha(t.palette.info.main, 0.12)}`,
                  '& p': {
                    m: 0,
                    mb: 1,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: (t) => t.palette.text.secondary,
                    '&:last-child': { mb: 0 },
                  },
                  '& h1, & h2, & h3': {
                    mt: 1.5,
                    mb: 0.5,
                    fontWeight: 700,
                    color: (t) => t.palette.text.secondary,
                  },
                  '& ul, & ol': {
                    pl: 3,
                    mb: 1,
                    '& li': {
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: (t) => t.palette.text.secondary,
                    },
                  },
                  '& code': {
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
                    color: 'error.main',
                  },
                  '& pre': {
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    overflow: 'auto',
                    '& code': {
                      bgcolor: 'transparent',
                      color: (t) => t.palette.text.primary,
                      px: 0,
                      py: 0,
                    },
                  },
                  '& blockquote': {
                    m: 0,
                    pl: 2,
                    borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
                    color: (t) => t.palette.text.disabled,
                    fontStyle: 'italic',
                  },
                  '& strong': { fontWeight: 700 },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    '& th, & td': {
                      px: 1.5,
                      py: 1,
                      fontSize: 13,
                      border: (t) => `1px solid ${t.palette.divider}`,
                    },
                    '& th': {
                      fontWeight: 700,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    },
                  },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {problem.description}
                </ReactMarkdown>
              </Box>
            )}

          {/* Formulas */}
          {problemFormulas.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunctionsIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  수식
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {problemFormulas.map((fText, fIdx) => (
                  <Box
                    key={fIdx}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                      boxShadow: (t) => t.customShadows?.z1,
                    }}
                  >
                    <KatexMath math={fText} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Choices */}
          <Stack spacing={1}>
            {problem.choices.map((choice, cIndex) => {
              const choiceNum = cIndex + 1;
              const isThisCorrect = correctAnswersList.includes(choiceNum);
              const isThisSelected = userSelections.includes(choiceNum);

              let choiceBgColor = 'transparent';
              let choiceBorderColor = 'divider';
              let choiceIcon = isMultiple ? (
                <CheckBoxOutlineBlankIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              );

              if (isSubmitted) {
                if (isThisCorrect) {
                  choiceBgColor = alpha(theme.palette.success.main, 0.08);
                  choiceBorderColor = theme.palette.success.main;
                  choiceIcon = <CheckCircleIcon sx={{ color: 'success.main' }} />;
                } else if (isThisSelected && !isThisCorrect) {
                  choiceBgColor = alpha(theme.palette.error.main, 0.08);
                  choiceBorderColor = theme.palette.error.main;
                  choiceIcon = <CancelIcon sx={{ color: 'error.main' }} />;
                }
              } else if (isThisSelected) {
                choiceIcon = isMultiple ? (
                  <CheckBoxIcon color="primary" />
                ) : (
                  <RadioButtonCheckedIcon color="primary" />
                );
              }

              return (
                <Box
                  key={cIndex}
                  onClick={() => !isSubmitted && handleSelectAnswer(pIndex, choiceNum, isMultiple)}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: `1px solid`,
                    borderColor: choiceBorderColor,
                    bgcolor: choiceBgColor,
                    cursor: isSubmitted ? 'default' : 'pointer',
                    transition: (t) => t.transitions.create(['background-color', 'border-color']),
                    ...(!isSubmitted && {
                      '&:hover': {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                        borderColor: 'primary.main',
                      },
                    }),
                    ...(isThisSelected &&
                      !isSubmitted && {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      }),
                  }}
                >
                  <FormControlLabel
                    value={choiceNum}
                    disabled={isSubmitted}
                    control={
                      isMultiple ? (
                        <Checkbox
                          size="small"
                          checked={isThisSelected}
                          icon={isSubmitted && isThisCorrect ? choiceIcon : undefined}
                          checkedIcon={isSubmitted ? choiceIcon : undefined}
                          sx={{
                            ...(isSubmitted &&
                              isThisCorrect && {
                                color: 'success.main',
                              }),
                          }}
                        />
                      ) : (
                        <Radio
                          size="small"
                          checked={isThisSelected}
                          icon={isSubmitted && isThisCorrect ? choiceIcon : undefined}
                          checkedIcon={isSubmitted ? choiceIcon : undefined}
                          sx={{
                            ...(isSubmitted &&
                              isThisCorrect && {
                                color: 'success.main',
                              }),
                          }}
                        />
                      )
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isThisSelected || (isSubmitted && isThisCorrect) ? 700 : 400,
                        }}
                      >
                        {choiceNum}. {choice}
                      </Typography>
                    }
                    sx={{
                      m: 0,
                      width: '100%',
                      pointerEvents: 'none',
                      '& .MuiFormControlLabel-label': { flexGrow: 1 },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            {!isSubmitted && userSelections.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSubmitAnswer(pIndex)}
                sx={{ fontWeight: 700 }}
              >
                제출하기
              </Button>
            )}
            <Button
              variant={isRevealed ? 'contained' : 'outlined'}
              color="info"
              startIcon={<VisibilityIcon />}
              onClick={() => handleRevealAnswer(pIndex)}
              sx={{ fontWeight: 700 }}
            >
              {isRevealed ? '정답 숨기기' : '정답 보기'}
            </Button>
          </Stack>

          {/* Answer Reveal Section */}
          <Collapse in={isRevealed}>
            <Stack
              spacing={2.5}
              sx={{
                mt: 1,
                p: 2.5,
                borderRadius: 2,
                bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
                border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.16)}`,
              }}
            >
              {/* Correct Answer */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  정답:{' '}
                  {correctAnswersList.length > 0 ? `${correctAnswersList.join(', ')}번` : '미지정'}
                </Typography>
              </Stack>

              {problem.explanation && (
                <Box
                  sx={{
                    '& p': {
                      m: 0,
                      mb: 1,
                      fontSize: 14,
                      lineHeight: 1.8,
                      '&:last-child': { mb: 0 },
                    },
                    '& h1, & h2, & h3': { mt: 1.5, mb: 0.5, fontWeight: 700 },
                    '& ul, & ol': { pl: 3, mb: 1, '& li': { fontSize: 14, lineHeight: 1.8 } },
                    '& code': {
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
                      color: (t) => t.palette.error.main,
                    },
                    '& pre': {
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                      overflow: 'auto',
                      '& code': {
                        bgcolor: 'transparent',
                        color: (t) => t.palette.text.primary,
                        px: 0,
                        py: 0,
                      },
                    },
                    '& blockquote': {
                      m: 0,
                      pl: 2,
                      borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
                      color: (t) => t.palette.text.disabled,
                      fontStyle: 'italic',
                    },
                    '& strong': { fontWeight: 700 },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}
                  >
                    해설
                  </Typography>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {problem.explanation}
                  </ReactMarkdown>
                </Box>
              )}

              {/* Explanation Formulas */}
              {problemExplanationFormulas.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FunctionsIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      해설 수식
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {problemExplanationFormulas.map((fText: string, fIdx: number) => (
                      <Box
                        key={fIdx}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                          boxShadow: (t) => t.customShadows?.z1,
                        }}
                      >
                        <KatexMath math={fText} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Choice Explanations */}
              {problem.choiceExplanations.some((e) => e) && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5 }}
                  >
                    객관식별 설명
                  </Typography>
                  <Stack spacing={1}>
                    {problem.choiceExplanations.map((exp, cIndex) =>
                      exp ? (
                        <Stack key={cIndex} direction="row" spacing={1} alignItems="flex-start">
                          <Box
                            sx={{
                              minWidth: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              bgcolor:
                                problem.answer === cIndex + 1 ? 'success.main' : 'text.disabled',
                              color: 'background.paper',
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {cIndex + 1}
                          </Box>
                          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            {exp}
                          </Typography>
                        </Stack>
                      ) : null
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Collapse>
        </Stack>
      </Card>

      {/* Bottom Navigation */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          disabled={currentIndex === 0}
          onClick={handlePrevProblem}
          startIcon={<NavigateBeforeIcon />}
          sx={{ fontWeight: 700 }}
        >
          이전 문제
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            문제
          </Typography>
          <TextField
            size="small"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            slotProps={{
              htmlInput: {
                style: { textAlign: 'center', padding: '4px 6px', width: '40px', fontWeight: 700 },
              },
            }}
            sx={{
              width: 52,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: 'background.paper',
              },
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            / {data.problems.length}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          disabled={currentIndex === data.problems.length - 1}
          onClick={handleNextProblem}
          endIcon={<NavigateNextIcon />}
          sx={{ fontWeight: 700 }}
        >
          다음 문제
        </Button>
      </Box>
    </Container>
  );
}
