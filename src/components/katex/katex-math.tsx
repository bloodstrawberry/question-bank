'use client';

import { useMemo } from 'react';
import katex from 'katex';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

interface KatexMathProps {
  math: string;
  inline?: boolean;
  sx?: SxProps<Theme>;
}

export function KatexMath({ math, inline = false, sx }: KatexMathProps) {
  const html = useMemo(() => {
    const trimmed = math ? math.trim() : '';
    if (!trimmed) return '';
    try {
      return katex.renderToString(trimmed, {
        displayMode: !inline,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (error) {
      return `<span style="color: #FF5630; font-weight: bold;">[수식 오류: ${(error as Error).message}]</span>`;
    }
  }, [math, inline]);

  if (!math || !math.trim()) {
    return null;
  }

  return (
    <Box
      component={inline ? 'span' : 'div'}
      dangerouslySetInnerHTML={{ __html: html }}
      sx={{
        py: inline ? 0 : 1,
        px: inline ? 0.5 : 1,
        overflowX: 'auto',
        maxWidth: '100%',
        display: inline ? 'inline-block' : 'block',
        '& .katex-display': {
          my: 0.5,
          overflowX: 'auto',
          overflowY: 'hidden',
        },
        ...sx,
      }}
    />
  );
}

export default KatexMath;
