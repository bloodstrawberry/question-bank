'use client';

import { useState, useEffect, useId } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';

interface MermaidDiagramProps {
  chart: string;
  idPrefix?: string;
}

export function MermaidDiagram({ chart, idPrefix = 'mermaid' }: MermaidDiagramProps) {
  const uniqueId = useId().replace(/:/g, '_');
  const elementId = `${idPrefix}_${uniqueId}`;

  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chart || !chart.trim()) {
      setSvgHtml('');
      setError(null);
      return;
    }

    let isCancelled = false;

    const renderChart = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          er: {
            useMaxWidth: true,
            layoutDirection: 'TB',
          },
        });

        // Ensure chart text starts with diagram header if missing
        let validChart = chart.trim();
        if (
          !validChart.startsWith('erDiagram') &&
          !validChart.startsWith('graph') &&
          !validChart.startsWith('flowchart')
        ) {
          validChart = `erDiagram\n${validChart}`;
        }

        const renderId = `render_${elementId}_${Date.now()}`;
        const { svg } = await mermaid.render(renderId, validChart);

        // Remove temporary container injected by mermaid if any
        const tempElem = document.getElementById(renderId);
        if (tempElem) {
          tempElem.remove();
        }

        if (!isCancelled) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);
          setSvgHtml('');
        }
      }
    };

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [chart, mounted, elementId]);

  if (!mounted) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">다이어그램 로딩 중...</Typography>
      </Box>
    );
  }

  if (!chart || !chart.trim()) {
    return null;
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
          border: (t) => `1px dashed ${alpha(t.palette.warning.main, 0.4)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <WarningAmberIcon color="warning" sx={{ fontSize: 20, flexShrink: 0 }} />
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'warning.dark', display: 'block' }}
          >
            ERD 다이어그램 구문 작성 중...
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
            Mermaid erDiagram 형식을 확인해주세요. (예: CUSTOMER ||--o&#123; ORDER : places)
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        bgcolor: (t) => alpha(t.palette.common.white, 0.9),
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.2)}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        maxWidth: '100%',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        },
      }}
    >
      <Box
        dangerouslySetInnerHTML={{ __html: svgHtml }}
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      />
    </Box>
  );
}
