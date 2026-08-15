'use client';

import { memo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';

import { ChartRenderer } from 'src/components/chart';

import { FastTextField } from './fast-text-field';
import { type ChartTemplate, COMMON_CHART_TEMPLATES } from './constants';

export { type ChartTemplate, COMMON_CHART_TEMPLATES };

interface ProblemEditorChartsProps {
  title?: string;
  charts: string[];
  onAddChart: () => void;
  onChangeChart: (chartIndex: number, value: string) => void;
  onRemoveChart: (chartIndex: number) => void;
  onInsertTemplate: (chartIndex: number, template: string) => void;
  emptyPlaceholderText?: string;
  labelPrefix?: string;
  hideHeader?: boolean;
}

export const ProblemEditorCharts = memo(function ProblemEditorCharts({
  title = '차트 (Plotly / Mermaid)',
  charts = [],
  onAddChart,
  onChangeChart,
  onRemoveChart,
  onInsertTemplate,
  emptyPlaceholderText = '등록된 차트가 없습니다.',
  labelPrefix = '차트',
  hideHeader = false,
}: ProblemEditorChartsProps) {
  return (
    <Box sx={{ mt: hideHeader ? 0 : 1 }}>
      {!hideHeader && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon color="success" sx={{ fontSize: 22 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {charts.length > 0 && (
              <Chip
                label={`${charts.length}개`}
                size="small"
                color="success"
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Box>

          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color="success"
            startIcon={<AddIcon />}
            onClick={onAddChart}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            {title} 추가
          </Button>
        </Box>
      )}

      {charts.length === 0 ? (
        <Box
          onClick={onAddChart}
          sx={{
            p: 2.5,
            textAlign: 'center',
            borderRadius: 1.5,
            border: (t) => `2px dashed ${alpha(t.palette.success.main, 0.2)}`,
            bgcolor: (t) => alpha(t.palette.success.main, 0.02),
            cursor: 'pointer',
            transition: (t) => t.transitions.create(['background-color', 'border-color']),
            '&:hover': {
              bgcolor: (t) => alpha(t.palette.success.main, 0.06),
              borderColor: 'success.main',
            },
          }}
        >
          <BarChartIcon sx={{ fontSize: 28, color: 'success.main', mb: 0.5, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {emptyPlaceholderText}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
            &quot;+ {title} 추가&quot; 버튼을 누르거나 여기를 클릭하여 차트(Plotly JSON 또는 Mermaid
            차트)를 입력하세요.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {charts.map((chartText, chartIndex) => (
            <Card
              key={chartIndex}
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.02),
                borderColor: (t) => alpha(t.palette.grey[500], 0.2),
                borderRadius: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {labelPrefix} #{chartIndex + 1}
                </Typography>
                <IconButton
                  size="small"
                  tabIndex={-1}
                  color="error"
                  onClick={() => onRemoveChart(chartIndex)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Quick Template Toolbar */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  자주 쓰는 차트 템플릿 클릭 삽입:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {COMMON_CHART_TEMPLATES.map((tmpl) => (
                    <Chip
                      key={tmpl.label}
                      tabIndex={-1}
                      label={tmpl.label}
                      size="small"
                      clickable
                      variant="outlined"
                      color="success"
                      onClick={() => onInsertTemplate(chartIndex, tmpl.code)}
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        height: 22,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <FastTextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                label={`${labelPrefix} #${chartIndex + 1}`}
                value={chartText}
                onChange={(val) => onChangeChart(chartIndex, val)}
                placeholder="Plotly JSON 형식 또는 Mermaid 차트 문법을 입력하세요"
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: 13,
                  },
                }}
              />

              {/* Real-time Visual Preview */}
              {chartText && chartText.trim() && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                    border: (t) => `1px dashed ${alpha(t.palette.success.main, 0.3)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'success.main', display: 'block', mb: 0.5 }}
                  >
                    미리보기:
                  </Typography>
                  <ChartRenderer chart={chartText} idPrefix={`preview_chart_${chartIndex}`} />
                </Box>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
});
