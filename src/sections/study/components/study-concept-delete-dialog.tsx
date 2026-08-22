'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

interface StudyConceptDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  conceptNumber: number;
  onConfirmDelete: () => void;
}

export function StudyConceptDeleteDialog({
  open,
  onClose,
  conceptNumber,
  onConfirmDelete,
}: StudyConceptDeleteDialogProps) {
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
      <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 800, fontSize: 18 }}>
        {conceptNumber}번 개념 삭제
      </DialogTitle>

      <DialogContent sx={{ p: 0, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          정말로 {conceptNumber}번 개념을 삭제하시겠습니까?
          <br />
          삭제된 내용은 복구할 수 없습니다.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} tabIndex={-1}>
          취소
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirmDelete();
            onClose();
          }}
          sx={{ fontWeight: 700 }}
        >
          삭제
        </Button>
      </DialogActions>
    </Dialog>
  );
}
