'use client';

import { memo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ProblemEditorNoAnswerDialogProps {
  open: boolean;
  onClose: () => void;
  unansweredProblems: number[];
  onIgnoreAndSave: () => void;
}

export const ProblemEditorNoAnswerDialog = memo(function ProblemEditorNoAnswerDialog({
  open,
  onClose,
  unansweredProblems,
  onIgnoreAndSave,
}: ProblemEditorNoAnswerDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
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
          mb: 1.5,
          fontWeight: 800,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'warning.main',
        }}
      >
        <WarningAmberIcon color="warning" />
        정답 미지정 경고
      </DialogTitle>

      <DialogContent sx={{ p: 0, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          다음 문제의 정답이 선택되지 않았습니다. 정답을 정하지 않고 이대로 저장하시겠습니까?
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          {unansweredProblems.map((num) => (
            <Chip
              key={num}
              label={`문제 ${num}`}
              size="small"
              color="warning"
              variant="filled"
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ minWidth: 80 }}>
          취소
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onIgnoreAndSave}
          sx={{ fontWeight: 700 }}
        >
          무시하고 저장
        </Button>
      </DialogActions>
    </Dialog>
  );
});
