'use client';

import { memo } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface ProblemEditorDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  problemNumber: number;
  onConfirmDelete: () => void;
}

export const ProblemEditorDeleteDialog = memo(function ProblemEditorDeleteDialog({
  open,
  onClose,
  problemNumber,
  onConfirmDelete,
}: ProblemEditorDeleteDialogProps) {
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
          color: 'error.main',
        }}
      >
        <DeleteOutlineIcon color="error" />
        문제 삭제 확인
      </DialogTitle>

      <DialogContent sx={{ p: 0, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          <strong>문제 {problemNumber}번</strong>을 정말 삭제하시겠습니까?
          <br />
          삭제된 문제는 복구할 수 없습니다.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ minWidth: 80 }}>
          취소
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onConfirmDelete}
          sx={{ fontWeight: 700 }}
        >
          삭제
        </Button>
      </DialogActions>
    </Dialog>
  );
});
