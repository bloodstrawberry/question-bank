'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { MermaidDiagram } from 'src/components/mermaid';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
      <Typography variant="caption">차트 로딩 중...</Typography>
    </Box>
  ),
});

interface ChartRendererProps {
  chart: string;
  idPrefix?: string;
  height?: number | string;
}

export function ChartRenderer({ chart, idPrefix = 'chart', height = 320 }: ChartRendererProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trimmed = (chart || '').trim();

  // Determine chart format type: 'mermaid' | 'plotly-json' | 'simple-kv' | 'empty'
  const isMermaid = useMemo(() => {
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return (
      lower.startsWith('pie') ||
      lower.startsWith('xychart') ||
      lower.startsWith('gantt') ||
      lower.startsWith('quadrantchart') ||
      lower.startsWith('timeline') ||
      lower.startsWith('mindmap') ||
      lower.startsWith('graph') ||
      lower.startsWith('flowchart') ||
      trimmed.includes('```mermaid')
    );
  }, [trimmed]);

  const parsedPlotly = useMemo(() => {
    if (!trimmed || isMermaid) return null;

    try {
      // Remove any markdown ```json ... ``` code fences
      const cleanJson = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      const parsed = JSON.parse(cleanJson);

      let data: any[] = [];
      let layout: Record<string, any> = {};
      let config: Record<string, any> = {
        responsive: true,
        displayModeBar: false,
      };

      if (Array.isArray(parsed)) {
        data = parsed;
      } else if (parsed && typeof parsed === 'object') {
        data = Array.isArray(parsed.data) ? parsed.data : [parsed];
        layout = parsed.layout || {};
        if (parsed.config) {
          config = { ...config, ...parsed.config };
        }
      }

      // Apply theme-consistent defaults
      const isDark = theme.palette.mode === 'dark';
      const textColor = theme.palette.text.primary;
      const gridColor = isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.08);

      const mergedLayout: Record<string, any> = {
        autosize: true,
        height: typeof height === 'number' ? height : 320,
        margin: { l: 40, r: 24, t: layout.title ? 40 : 20, b: 40, pad: 4 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          family: theme.typography.fontFamily || 'inherit',
          color: textColor,
          size: 12,
        },
        xaxis: {
          gridcolor: gridColor,
          linecolor: gridColor,
          tickfont: { color: textColor },
          ...(layout.xaxis || {}),
        },
        yaxis: {
          gridcolor: gridColor,
          linecolor: gridColor,
          tickfont: { color: textColor },
          ...(layout.yaxis || {}),
        },
        ...layout,
      };

      return { data, layout: mergedLayout, config, error: null };
    } catch (err: unknown) {
      // Check for simple Key: Value format e.g. "항목1: 10\n항목2: 20"
      const lines = trimmed
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const kvPairs = lines.map((l) => {
        const parts = l.split(/[:=,\t]/);
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parseFloat(parts[1].trim());
          if (!isNaN(val)) {
            return { key, val };
          }
        }
        return null;
      });

      if (kvPairs.length > 0 && kvPairs.every(Boolean)) {
        const validKvs = kvPairs as { key: string; val: number }[];
        const isDark = theme.palette.mode === 'dark';
        const textColor = theme.palette.text.primary;

        return {
          data: [
            {
              x: validKvs.map((k) => k.key),
              y: validKvs.map((k) => k.val),
              type: 'bar',
              marker: {
                color: theme.palette.primary.main,
              },
            },
          ],
          layout: {
            autosize: true,
            height: typeof height === 'number' ? height : 300,
            margin: { l: 40, r: 24, t: 20, b: 40 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
              family: theme.typography.fontFamily || 'inherit',
              color: textColor,
            },
          },
          config: { responsive: true, displayModeBar: false },
          error: null,
        };
      }

      return {
        data: [],
        layout: {},
        config: {},
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [trimmed, isMermaid, theme, height]);

  if (!mounted) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">차트 준비 중...</Typography>
      </Box>
    );
  }

  if (!trimmed) {
    return null;
  }

  // Render Mermaid diagrams
  if (isMermaid) {
    return (
      <Box sx={{ my: 1.5, display: 'flex', justifyContent: 'center' }}>
        <MermaidDiagram chart={trimmed} idPrefix={idPrefix} />
      </Box>
    );
  }

  // Render Plotly error fallback
  if (parsedPlotly?.error) {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 2,
          my: 1.5,
          borderColor: 'error.main',
          bgcolor: (t) => alpha(t.palette.error.main, 0.04),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', mb: 1 }}>
          <WarningAmberIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            차트 구문 오류 (Plotly JSON 또는 Mermaid 문법 오류)
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'error.dark', display: 'block', mb: 1 }}>
          {parsedPlotly.error}
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 1.5,
            m: 0,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
            fontSize: 12,
            fontFamily: 'monospace',
            overflowX: 'auto',
          }}
        >
          {trimmed}
        </Box>
      </Card>
    );
  }

  // Render Plotly interactive chart
  if (parsedPlotly && parsedPlotly.data.length > 0) {
    return (
      <Box
        sx={{
          my: 1.5,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          '& .plot-container': {
            width: '100% !important',
          },
          '& .js-plotly-plot': {
            width: '100% !important',
          },
        }}
      >
        <Plot
          data={parsedPlotly.data}
          layout={parsedPlotly.layout}
          config={parsedPlotly.config}
          style={{ width: '100%', minHeight: 280 }}
          useResizeHandler
        />
      </Box>
    );
  }

  return null;
}
