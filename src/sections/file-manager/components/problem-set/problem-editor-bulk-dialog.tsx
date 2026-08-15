'use client';

import { useState, useEffect, useCallback, memo } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

interface ProblemEditorBulkDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
  placeholder?: string;
  choicesCount?: number;
  bulkText?: string;
  onBulkTextChange?: (text: string) => void;
  onApplyBulk: (text?: string) => void;
}

export const ProblemEditorBulkDialog = memo(function ProblemEditorBulkDialog({
  open,
  onClose,
  title = '선택지 일괄 입력 (Bulk Edit)',
  description,
  placeholder = `A\nB\n\nC\nD\nE`,
  choicesCount,
  bulkText = '',
  onBulkTextChange,
  onApplyBulk,
}: ProblemEditorBulkDialogProps) {
  const [localText, setLocalText] = useState(bulkText);

  // Sync initial bulk text when dialog opens
  useEffect(() => {
    if (open) {
      setLocalText(bulkText);
    }
  }, [open, bulkText]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalText(val);
      onBulkTextChange?.(val);
    },
    [onBulkTextChange]
  );

  const handleApply = useCallback(() => {
    onApplyBulk(localText);
  }, [onApplyBulk, localText]);

  const defaultDescription =
    choicesCount !== undefined ? (
      <>
        줄바꿈으로 구분하여 한 번에 입력하세요. 빈 줄은 자동으로 삭제되며, 현재 선택지 문항 수(
        {choicesCount}개)보다 많은 번호는 자동으로 무시됩니다.
      </>
    ) : (
      <>줄바꿈으로 구분하여 한 번에 입력하세요. 빈 줄은 자동으로 삭제됩니다.</>
    );

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
      <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 800, fontSize: 18 }}>{title}</DialogTitle>

      <DialogContent sx={{ p: 0, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {description || defaultDescription}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={12}
          value={localText}
          onChange={handleChange}
          placeholder={placeholder}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: 14,
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          취소
        </Button>
        <Button variant="contained" color="primary" onClick={handleApply} sx={{ fontWeight: 700 }}>
          적용하기
        </Button>
      </DialogActions>
    </Dialog>
  );
});
