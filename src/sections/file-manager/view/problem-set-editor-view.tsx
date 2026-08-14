'use client';

import { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { alpha, useTheme } from '@mui/material/styles';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FunctionsIcon from '@mui/icons-material/Functions';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import TagIcon from '@mui/icons-material/Tag';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { debounce } from 'es-toolkit';

import { getFileScript, saveFileScript } from 'src/api/indexDB';
import { toast } from 'src/components/snackbar';
import { MarkdownEditor } from 'src/components/markdown-editor';
import { KatexMath } from 'src/components/katex';

// ----------------------------------------------------------------------

interface FastTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  debounceMs?: number;
}

function FastTextField({ value, onChange, debounceMs = 250, ...other }: FastTextFieldProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((val: string) => {
        onChangeRef.current(val);
      }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLocalValue(newText);
    debouncedOnChange(newText);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (other.onBlur) {
      other.onBlur(e);
    }
    debouncedOnChange.cancel();
    onChangeRef.current(localValue);
  };

  return <TextField {...other} value={localValue} onChange={handleChange} onBlur={handleBlur} />;
}

function FormulaPreviewCard({ fText }: { fText: string }) {
  const deferredText = useDeferredValue(fText);
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'text.disabled',
          display: 'block',
          mb: 0.5,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        KaTeX 실시간 미리보기
      </Typography>
      {deferredText.trim() ? (
        <KatexMath math={deferredText} />
      ) : (
        <Typography
          variant="body2"
          sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: 13 }}
        >
          LaTeX 수식 코드를 입력하면 실시간 렌더링 결과가 표시됩니다.
        </Typography>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

const COMMON_LATEX_SYMBOLS = [
  { label: '분수', code: '\\frac{a}{b}' },
  { label: '지수', code: 'x^{n}' },
  { label: '아래첨자', code: 'x_{n}' },
  { label: '제곱근', code: '\\sqrt{x}' },
  { label: 'n제곱근', code: '\\sqrt[n]{x}' },
  { label: '합 (∑)', code: '\\sum_{i=1}^{n}' },
  { label: '적분 (∫)', code: '\\int_{a}^{b}' },
  { label: '±', code: '\\pm' },
  { label: '×', code: '\\times' },
  { label: '÷', code: '\\div' },
  { label: '≠', code: '\\neq' },
  { label: '≤', code: '\\le' },
  { label: '≥', code: '\\ge' },
  { label: 'α', code: '\\alpha' },
  { label: 'β', code: '\\beta' },
  { label: 'θ', code: '\\theta' },
  { label: 'π', code: '\\pi' },
  { label: '∞', code: '\\infty' },
];

interface Problem {
  hashtags: string[];
  question: string;
  description: string;
  formulas?: string[];
  formula?: string;
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
    formulas: [],
    choices: ['', '', '', ''],
    answer: 0,
    explanation: '',
    choiceExplanations: ['', '', '', ''],
  };
}

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
  const theme = useTheme();

  const [data, setData] = useState<ProblemSetData>({ problems: [createEmptyProblem()] });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialProblemIndex);
  const [pageInput, setPageInput] = useState(String(initialProblemIndex + 1));
  const [hashtagInput, setHashtagInput] = useState<Record<number, string>>({});
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    const loadScript = async () => {
      setLoading(true);
      const startIdx = initialProblemIndex ?? 0;
      setCurrentIndex(startIdx);
      setPageInput(String(startIdx + 1));
      try {
        const saved = await getFileScript(fileId);
        if (saved?.problems && saved.problems.length > 0) {
          const normalized = saved.problems.map((p: any) => {
            const choices: string[] = Array.isArray(p.choices) ? p.choices : ['', '', '', ''];
            const rawExps: string[] = Array.isArray(p.choiceExplanations)
              ? p.choiceExplanations
              : [];
            const choiceExplanations = choices.map((_: string, i: number) => rawExps[i] || '');
            return {
              ...createEmptyProblem(),
              ...p,
              choices,
              choiceExplanations,
              formulas: Array.isArray(p.formulas) ? p.formulas : p.formula ? [p.formula] : [],
            };
          });
          setData({ problems: normalized });
          const validIndex = Math.min(Math.max(0, startIdx), normalized.length - 1);
          setCurrentIndex(validIndex);
          setPageInput(String(validIndex + 1));
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
  }, [fileId, initialProblemIndex]);

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
      onSaveSuccess(currentIndex);
    } catch (error) {
      console.error('Failed to save problem set', error);
      toast.error('저장에 실패했습니다.');
    }
  }, [fileId, data, onSave, onSaveSuccess, currentIndex]);

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

  const handleAddProblem = useCallback(() => {
    setData((prev) => {
      const newProblems = [...prev.problems, createEmptyProblem()];
      setCurrentIndex(newProblems.length - 1);
      return { ...prev, problems: newProblems };
    });
  }, []);

  const updateProblem = useCallback((index: number, updates: Partial<Problem>) => {
    setData((prev) => {
      const newProblems = [...prev.problems];
      newProblems[index] = { ...newProblems[index], ...updates };
      return { ...prev, problems: newProblems };
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        handleAddProblem();
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
  }, [data?.problems, handleSave, handleAddProblem]);

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

  const handleAddFormula = useCallback(
    (problemIndex: number) => {
      const currentFormulas = data.problems[problemIndex].formulas || [];
      updateProblem(problemIndex, { formulas: [...currentFormulas, ''] });
    },
    [data.problems, updateProblem]
  );

  const handleChangeFormula = useCallback(
    (problemIndex: number, formulaIndex: number, value: string) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      currentFormulas[formulaIndex] = value;
      updateProblem(problemIndex, { formulas: currentFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveFormula = useCallback(
    (problemIndex: number, formulaIndex: number) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      const updated = currentFormulas.filter((_, i) => i !== formulaIndex);
      updateProblem(problemIndex, { formulas: updated });
    },
    [data.problems, updateProblem]
  );

  const handleInsertSymbol = useCallback(
    (problemIndex: number, formulaIndex: number, symbol: string) => {
      const currentFormulas = [...(data.problems[problemIndex].formulas || [])];
      const currentText = currentFormulas[formulaIndex] || '';
      const updatedText = currentText ? `${currentText} ${symbol}` : symbol;
      currentFormulas[formulaIndex] = updatedText;
      updateProblem(problemIndex, { formulas: currentFormulas });
    },
    [data.problems, updateProblem]
  );

  const handleAddChoice = useCallback(
    (problemIndex: number) => {
      const currentChoices = data.problems[problemIndex].choices || [];
      const currentExplanations = data.problems[problemIndex].choiceExplanations || [];
      updateProblem(problemIndex, {
        choices: [...currentChoices, ''],
        choiceExplanations: [...currentExplanations, ''],
      });
    },
    [data.problems, updateProblem]
  );

  const handleRemoveChoice = useCallback(
    (problemIndex: number, choiceIndex: number) => {
      const prob = data.problems[problemIndex];
      const currentChoices = prob.choices || [];
      if (currentChoices.length <= 2) return;

      const currentExplanations = prob.choiceExplanations || [];
      const newChoices = currentChoices.filter((_, i) => i !== choiceIndex);
      const newExplanations = currentExplanations.filter((_, i) => i !== choiceIndex);

      let newAnswer = prob.answer;
      const choiceNum = choiceIndex + 1;
      if (prob.answer === choiceNum) {
        newAnswer = 0;
      } else if (prob.answer > choiceNum) {
        newAnswer = prob.answer - 1;
      }

      updateProblem(problemIndex, {
        choices: newChoices,
        choiceExplanations: newExplanations,
        answer: newAnswer,
      });
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

  const activeProblemIndex = Math.min(currentIndex, Math.max(0, data.problems.length - 1));
  const problem = data.problems[activeProblemIndex] || data.problems[0] || createEmptyProblem();
  const pIndex = activeProblemIndex;

  const handleOpenBulkDialog = useCallback(() => {
    const currentChoices = problem?.choices || [];
    setBulkText(currentChoices.filter(Boolean).join('\n'));
    setBulkDialogOpen(true);
  }, [problem?.choices]);

  const handleApplyBulk = useCallback(() => {
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\s*(?:\d+[\.\)]|\(\d+\)|[①-⑮])\s*/, ''));

    const currentChoices = problem?.choices || [];
    const newChoices = currentChoices.map((existing, i) => (i < lines.length ? lines[i] : ''));

    updateProblem(pIndex, { choices: newChoices });
    setBulkDialogOpen(false);
    toast.success('선택지가 일괄 적용되었습니다.');
  }, [bulkText, problem?.choices, updateProblem, pIndex]);

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
          <FastTextField
            fullWidth
            label="문제"
            multiline
            minRows={2}
            value={problem.question}
            onChange={(val) => updateProblem(pIndex, { question: val })}
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

          {/* Formula Section */}
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunctionsIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  수식 (KaTeX)
                </Typography>
                {(problem.formulas?.length || 0) > 0 && (
                  <Chip
                    label={`${problem.formulas?.length}개`}
                    size="small"
                    color="primary"
                    variant="soft"
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                )}
              </Box>

              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleAddFormula(pIndex)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                수식 추가
              </Button>
            </Box>

            {!problem.formulas || problem.formulas.length === 0 ? (
              <Box
                onClick={() => handleAddFormula(pIndex)}
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1.5,
                  border: (t) => `2px dashed ${alpha(t.palette.primary.main, 0.2)}`,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                  cursor: 'pointer',
                  transition: (t) => t.transitions.create(['background-color', 'border-color']),
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                    borderColor: 'primary.main',
                  },
                }}
              >
                <FunctionsIcon
                  sx={{ fontSize: 28, color: 'primary.main', mb: 0.5, opacity: 0.7 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  등록된 수식이 없습니다.
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                >
                  "+ 수식 추가" 버튼을 누르거나 여기를 클릭하여 LaTeX 수식을 입력하세요.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {problem.formulas.map((fText, fIndex) => (
                  <Card
                    key={fIndex}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.02),
                      borderColor: (t) => alpha(t.palette.grey[500], 0.2),
                      borderRadius: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: 'primary.main' }}
                      >
                        수식 #{fIndex + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFormula(pIndex, fIndex)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Quick Symbol Toolbar */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
                      >
                        자주 쓰는 기호 클릭 삽입:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {COMMON_LATEX_SYMBOLS.map((sym) => (
                          <Chip
                            key={sym.label}
                            label={sym.label}
                            size="small"
                            clickable
                            variant="outlined"
                            onClick={() => handleInsertSymbol(pIndex, fIndex, sym.code)}
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              height: 22,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <FastTextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      label={`LaTeX 수식 #${fIndex + 1}`}
                      value={fText}
                      onChange={(val) => handleChangeFormula(pIndex, fIndex, val)}
                      placeholder="예: \int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
                      sx={{ mb: 1.5 }}
                    />

                    {/* Live Preview Box */}
                    <FormulaPreviewCard fText={fText} />
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Choices */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                객관식 선택지 ({problem.choices.length}개)
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  startIcon={<FormatListNumberedIcon />}
                  onClick={handleOpenBulkDialog}
                  sx={{ borderRadius: 1.5, fontWeight: 700 }}
                >
                  Bulk
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddChoice(pIndex)}
                  sx={{ borderRadius: 1.5, fontWeight: 700 }}
                >
                  선택지 추가
                </Button>
              </Box>
            </Box>

            <Stack spacing={1.5}>
              {problem.choices.map((choice, cIndex) => (
                <Box
                  key={cIndex}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <FastTextField
                    fullWidth
                    size="small"
                    label={`${cIndex + 1}번`}
                    value={choice}
                    onChange={(val) => handleChangeChoice(pIndex, cIndex, val)}
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
                  <IconButton
                    size="small"
                    color="error"
                    disabled={problem.choices.length <= 2}
                    onClick={() => handleRemoveChoice(pIndex, cIndex)}
                    title="선택지 삭제"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
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
              {Array.from({ length: problem.choices.length }, (_, i) => i + 1).map((num) => (
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
                <FastTextField
                  key={cIndex}
                  fullWidth
                  size="small"
                  label={`${cIndex + 1}번 설명`}
                  value={exp}
                  onChange={(val) => handleChangeChoiceExplanation(pIndex, cIndex, val)}
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

      {/* Bulk Choice Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            p: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 800, fontSize: 18 }}>
          선택지 일괄 입력 (Bulk Edit)
        </DialogTitle>

        <DialogContent sx={{ p: 0, py: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            줄바꿈으로 구분하여 한 번에 입력하세요. 빈 줄은 자동으로 삭제되며, 현재 선택지 문항 수(
            {problem.choices.length}개)보다 많은 번호는 자동으로 무시됩니다.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`A\nB\n\nC\nD\nE`}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: 14,
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setBulkDialogOpen(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyBulk}
            sx={{ fontWeight: 700 }}
          >
            적용하기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
