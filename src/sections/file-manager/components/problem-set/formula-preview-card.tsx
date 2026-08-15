import { memo, useDeferredValue } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { KatexMath } from 'src/components/katex';

interface FormulaPreviewCardProps {
  fText: string;
}

export const FormulaPreviewCard = memo(function FormulaPreviewCard({
  fText,
}: FormulaPreviewCardProps) {
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
});
