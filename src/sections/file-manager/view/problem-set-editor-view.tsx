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
  const [hashtagInput, setHashtagInput] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadScript = async () => {
      setLoading(true);
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [handleSave]);

  const updateProblem = useCallback((index: number, updates: Partial<Problem>) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      newProblems[index] = { ...newProblems[index], ...updates };
      return { ...prev, problems: newProblems };
    });
  }, []);

  const handleAddProblem = useCallback(() => {
    setData((prev) => ({
      ...prev,
      problems: [...prev.problems, createEmptyProblem()],
    }));
  }, []);

  const handleDuplicateProblem = useCallback((index: number) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      const duplicated = JSON.parse(JSON.stringify(prev.problems[index])) as Problem;
      newProblems.splice(index + 1, 0, duplicated);
      return { ...prev, problems: newProblems };
    });
  }, []);

  const handleRemoveProblem = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== index),
    }));
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

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
      {/* Sticky Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
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
      </Stack>

      <Stack spacing={4}>
        {data.problems.map((problem, pIndex) => (
          <Card
            key={pIndex}
            sx={{
              p: 3,
              border: (t) => `solid 1px ${t.vars.palette.divider}`,
              position: 'relative',
            }}
          >
            {/* Problem Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                문제 {pIndex + 1}
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.disabled' }}>
                  / {data.problems.length}
                </Typography>
              </Typography>

              <Stack direction="row" spacing={0.5}>
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
              </Stack>
            </Stack>

            <Stack spacing={3}>
              {/* Hashtags */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}
                >
                  해시태그
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
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
                </Stack>
                <TextField
                  size="small"
                  placeholder="태그 입력 후 Enter"
                  value={hashtagInput[pIndex] || ''}
                  onChange={(e) =>
                    setHashtagInput((prev) => ({ ...prev, [pIndex]: e.target.value }))
                  }
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
                      onChange={(e) =>
                        handleChangeChoiceExplanation(pIndex, cIndex, e.target.value)
                      }
                      placeholder={`${cIndex + 1}번 선택지에 대한 설명`}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Card>
        ))}

        {/* Add Problem Button */}
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddProblem}
          variant="outlined"
          fullWidth
          size="large"
          sx={{
            py: 2.5,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderRadius: 2,
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            },
          }}
        >
          문제 추가
        </Button>
      </Stack>

      {/* Footer Save Button */}
      <Box sx={{ mt: 8, pb: 10, display: 'flex', justifyContent: 'center' }}>
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
