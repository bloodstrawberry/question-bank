'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { alpha } from '@mui/material/styles';

import { RichContentRenderer } from './rich-content-renderer';

// ----------------------------------------------------------------------

interface ProblemEditorCorrectionDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (resultText: string) => void;
  initialSentence?: string;
  initialWrongText?: string;
  initialCorrectText?: string;
  title?: string;
}

export function ProblemEditorCorrectionDialog({
  open,
  onClose,
  onApply,
  initialSentence = '',
  initialWrongText = '',
  initialCorrectText = '',
  title = '오답 교정 표기 (취소선 + 올바른 말)',
}: ProblemEditorCorrectionDialogProps) {
  const [sentence, setSentence] = useState(initialSentence);
  const [wrongText, setWrongText] = useState(initialWrongText);
  const [correctText, setCorrectText] = useState(initialCorrectText);

  useEffect(() => {
    if (open) {
      setSentence(initialSentence);
      setWrongText(initialWrongText);
      setCorrectText(initialCorrectText);
    }
  }, [open, initialSentence, initialWrongText, initialCorrectText]);

  // Handle text selection in the sentence input to quickly fill wrongText
  const handleSentenceMouseUp = useCallback(
    (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start !== null && end !== null && start < end) {
        const selected = target.value.substring(start, end).trim();
        if (selected) {
          setWrongText(selected);
        }
      }
    },
    []
  );

  // Generate the formatted result
  const generatedResult = useMemo(() => {
    const trimmedWrong = wrongText.trim();
    const trimmedCorrect = correctText.trim();

    if (!trimmedWrong && !trimmedCorrect) {
      return sentence;
    }

    const rubyTag = `<ruby><s>${trimmedWrong || '오답'}</s><rt>${trimmedCorrect || '정답'}</rt></ruby>`;

    if (sentence && sentence.trim().length > 0) {
      if (trimmedWrong && sentence.includes(trimmedWrong)) {
        return sentence.replace(trimmedWrong, rubyTag);
      }
      return `${sentence} ${rubyTag}`;
    }

    return rubyTag;
  }, [sentence, wrongText, correctText]);

  const handleApply = () => {
    if (!generatedResult || generatedResult.trim().length === 0) {
      onClose();
      return;
    }
    onApply(generatedResult);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          p: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        <AutoFixHighIcon color="primary" />
        {title}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          틀린 단어에 <strong>취소선</strong>을 긋고, 그 위에 <strong>올바른 말(정답)</strong>을
          표시하는 루비(Ruby) 마크다운을 생성합니다.
        </Typography>

        {/* Sentence Input (Optional Context) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              전체 문장 (선택 사항)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              문장에서 틀린 단어를 드래그하면 아래에 자동 입력됩니다
            </Typography>
          </Box>

          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            slotProps={{
              htmlInput: {
                onMouseUp: handleSentenceMouseUp,
              },
            }}
            placeholder="예: 트랜잭션은 물리적인 업무 단위이다."
          />
        </Box>

        {/* Wrong & Correct Input Fields */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
              틀린 단어 (취소선)
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={wrongText}
              onChange={(e) => setWrongText(e.target.value)}
              placeholder="예: 물리적인"
              autoFocus
            />
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              올바른 단어 (정답 표시)
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              placeholder="예: 논리적인"
            />
          </Box>
        </Box>

        {/* Live Preview Card */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            실시간 미리보기
          </Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: (t) => `1px solid ${t.palette.divider}`,
              minHeight: 48,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {generatedResult ? (
              <RichContentRenderer content={generatedResult} idPrefix="correction_preview" />
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                틀린 단어와 올바른 단어를 입력하면 여기에 미리보기가 표시됩니다.
              </Typography>
            )}
          </Box>

          {/* Generated HTML Code View */}
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              생성되는 코드: <code>{generatedResult}</code>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApply}
          startIcon={<AutoFixHighIcon />}
          sx={{ fontWeight: 700 }}
        >
          설명에 적용하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProblemEditorCorrectionDialog;
