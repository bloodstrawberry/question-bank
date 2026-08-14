'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { alpha, useTheme } from '@mui/material/styles';

import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import TagIcon from '@mui/icons-material/Tag';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { getFileScript, saveFileScript } from 'src/api/indexDB';
import { toast } from 'src/components/snackbar';
import { MarkdownEditor } from 'src/components/markdown-editor';

// ----------------------------------------------------------------------

interface Problem {
  hashtags: string[];
  question: string;
  description: string;
  choices: string[];
  answer: number;
  explanation: string;
  choiceExplanations: string[];
}

interface ProblemSetData {
  problems: Problem[];
}

function createEmptyProblem(): Problem {
  return {
    hashtags: [],
    question: '',
    description: '',
    choices: ['', '', '', '', ''],
    answer: 0,
    explanation: '',
    choiceExplanations: ['', '', '', '', ''],
  };
}

interface Props {
  fileId: string;
  fileName: string;
  onBack: () => void;
  onSaveSuccess: () => void;
  onSave?: (fileId: string) => void;
}

export function ProblemSetEditorView({ fileId, fileName, onBack, onSaveSuccess, onSave }: Props) {
  const theme = useTheme();

  const [data, setData] = useState<ProblemSetData>({ problems: [createEmptyProblem()] });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [hashtagInput, setHashtagInput] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadScript = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setPageInput('1');
      try {
        const saved = await getFileScript(fileId);
        if (saved?.problems && saved.problems.length > 0) {
          setData(saved as ProblemSetData);
        } else {
          setData({ problems: [createEmptyProblem()] });
        }
      } catch (error) {
        console.error('Failed to load problem set', error);
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, [fileId]);

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
      onSave?.(fileId);
      toast.success('문제 모음이 저장되었습니다!');
      onSaveSuccess();
    } catch (error) {
      console.error('Failed to save problem set', error);
      toast.error('저장에 실패했습니다.');
    }
  }, [fileId, data, onSave, onSaveSuccess]);

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
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
  }, [data?.problems, handleSave]);

  const updateProblem = useCallback((index: number, updates: Partial<Problem>) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      newProblems[index] = { ...newProblems[index], ...updates };
      return { ...prev, problems: newProblems };
    });
  }, []);

  const handleAddProblem = useCallback(() => {
    setData((prev) => {
      const newProblems = [...prev.problems, createEmptyProblem()];
      setCurrentIndex(newProblems.length - 1);
      return { ...prev, problems: newProblems };
    });
  }, []);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading editor...
        </Typography>
      </Box>
    );
  }

  const activeProblemIndex = Math.min(currentIndex, data.problems.length - 1);
  const problem = data.problems[activeProblemIndex] || data.problems[0];
  const pIndex = activeProblemIndex;

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

      {/* Problem Card */}
      <Card
        key={pIndex}
        sx={{
          p: 3,
          border: (t) => `solid 1px ${t.vars.palette.divider}`,
          position: 'relative',
        }}
      >
        {/* Problem Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            문제 {pIndex + 1}
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.disabled' }}>
              / {data.problems.length}
            </Typography>
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="문제 복제">
              <IconButton size="small" onClick={() => handleDuplicateProblem(pIndex)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="문제 삭제">
              <IconButton
                size="small"
                color="error"
                disabled={data.problems.length === 1}
                onClick={() => handleRemoveProblem(pIndex)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* Hashtags */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}
            >
              해시태그
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {problem.hashtags.map((tag, tagIndex) => (
                <Chip
                  key={tagIndex}
                  label={tag}
                  color="primary"
                  variant="soft"
                  onDelete={() => handleRemoveHashtag(pIndex, tagIndex)}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
            <TextField
              size="small"
              placeholder="태그 입력 후 Enter"
              value={hashtagInput[pIndex] || ''}
              onChange={(e) => setHashtagInput((prev) => ({ ...prev, [pIndex]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddHashtag(pIndex, hashtagInput[pIndex] || '');
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <TagIcon sx={{ color: 'text.disabled', mr: 0.5, fontSize: 18 }} />
                  ),
                },
              }}
              sx={{ maxWidth: 300 }}
            />
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Question */}
          <TextField
            fullWidth
            label="문제"
            multiline
            minRows={2}
            value={problem.question}
            onChange={(e) => updateProblem(pIndex, { question: e.target.value })}
            placeholder="문제를 입력하세요..."
          />

          {/* Description */}
          <MarkdownEditor
            label="문제 추가 설명"
            value={problem.description}
            onChange={(val) => updateProblem(pIndex, { description: val })}
            placeholder="문제에 대한 보충 설명을 입력하세요... (마크다운 지원)"
            minRows={3}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Choices */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}
            >
              객관식
            </Typography>
            <Stack spacing={1.5}>
              {problem.choices.map((choice, cIndex) => (
                <TextField
                  key={cIndex}
                  fullWidth
                  size="small"
                  label={`${cIndex + 1}번`}
                  value={choice}
                  onChange={(e) => handleChangeChoice(pIndex, cIndex, e.target.value)}
                  placeholder={`${cIndex + 1}번 선택지를 입력하세요`}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      ...(problem.answer === cIndex + 1 && {
                        bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                        '& fieldset': {
                          borderColor: 'success.main',
                          borderWidth: 2,
                        },
                      }),
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Answer */}
          <FormControl sx={{ maxWidth: 200 }}>
            <InputLabel>정답 번호</InputLabel>
            <Select
              label="정답 번호"
              value={problem.answer || ''}
              onChange={(e) => updateProblem(pIndex, { answer: e.target.value as number })}
            >
              <MenuItem value="">
                <em>미지정</em>
              </MenuItem>
              {[1, 2, 3, 4, 5].map((num) => (
                <MenuItem key={num} value={num}>
                  {num}번
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Explanation */}
          <MarkdownEditor
            label="해설"
            value={problem.explanation}
            onChange={(val) => updateProblem(pIndex, { explanation: val })}
            placeholder="정답에 대한 해설을 입력하세요... (마크다운 지원)"
            minRows={3}
          />

          {/* Choice Explanations */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}
            >
              객관식별 설명
            </Typography>
            <Stack spacing={1.5}>
              {problem.choiceExplanations.map((exp, cIndex) => (
                <TextField
                  key={cIndex}
                  fullWidth
                  size="small"
                  label={`${cIndex + 1}번 설명`}
                  value={exp}
                  onChange={(e) => handleChangeChoiceExplanation(pIndex, cIndex, e.target.value)}
                  placeholder={`${cIndex + 1}번 선택지에 대한 설명`}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Card>

      {/* Bottom Navigation & Add Problem Controls */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
    </Container>
  );
}
