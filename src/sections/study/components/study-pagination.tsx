'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

// ----------------------------------------------------------------------

interface StudyPaginationProps {
  currentIndex: number;
  totalConcepts: number;
  pageInput: string;
  onPrev: () => void;
  onNext: () => void;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputBlur: () => void;
  onPageInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  variant?: 'header' | 'footer';
}

export function StudyPagination({
  currentIndex,
  totalConcepts,
  pageInput,
  onPrev,
  onNext,
  onPageInputChange,
  onPageInputBlur,
  onPageInputKeyDown,
  variant = 'header',
}: StudyPaginationProps) {
  if (variant === 'header') {
    return (
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
        <Tooltip title="이전 개념 (Shift + ←)">
          <span>
            <IconButton
              size="small"
              onClick={onPrev}
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
            개념
          </Typography>
          <TextField
            size="small"
            value={pageInput}
            onChange={onPageInputChange}
            onBlur={onPageInputBlur}
            onKeyDown={onPageInputKeyDown}
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
            / {totalConcepts}
          </Typography>
        </Box>

        <Tooltip title="다음 개념 (Shift + →)">
          <span>
            <IconButton
              size="small"
              onClick={onNext}
              disabled={currentIndex === totalConcepts - 1}
              sx={{ color: 'text.primary' }}
            >
              <NavigateNextIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Button
        variant="outlined"
        disabled={currentIndex === 0}
        onClick={onPrev}
        startIcon={<NavigateBeforeIcon />}
        sx={{ fontWeight: 700 }}
      >
        이전 개념
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          개념
        </Typography>
        <TextField
          size="small"
          value={pageInput}
          onChange={onPageInputChange}
          onBlur={onPageInputBlur}
          onKeyDown={onPageInputKeyDown}
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
          / {totalConcepts}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        disabled={currentIndex === totalConcepts - 1}
        onClick={onNext}
        endIcon={<NavigateNextIcon />}
        sx={{ fontWeight: 700 }}
      >
        다음 개념
      </Button>
    </Box>
  );
}
