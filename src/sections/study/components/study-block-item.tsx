'use client';

import type { StudyBlock } from '../types';

import { memo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { ChartRenderer } from 'src/components/chart';
import { MermaidDiagram } from 'src/components/mermaid';
import { MarkdownEditor } from 'src/components/markdown-editor';

import { FastTextField } from 'src/sections/file-manager/components/problem-set/fast-text-field';
import { FormulaPreviewCard } from 'src/sections/file-manager/components/problem-set/formula-preview-card';
import { RichContentRenderer } from 'src/sections/file-manager/components/problem-set/rich-content-renderer';
import {
  COMMON_LATEX_SYMBOLS,
  COMMON_ERD_TEMPLATES,
  COMMON_CHART_TEMPLATES,
} from 'src/sections/file-manager/components/problem-set/constants';

import { COMMON_TRAP_TEMPLATES } from '../constants';

// ----------------------------------------------------------------------

interface StudyBlockItemProps {
  block: StudyBlock;
  index: number;
  totalBlocks: number;
  onChangeContent: (content: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const BLOCK_CONFIG = {
  markdown: {
    label: '개념 설명 (Markdown)',
    color: 'primary.main',
    chipColor: 'primary' as const,
    icon: <ArticleIcon fontSize="small" />,
  },
  trap: {
    label: '시험 단골 함정 (Trap / 주의)',
    color: 'warning.main',
    chipColor: 'warning' as const,
    icon: <WarningAmberRoundedIcon fontSize="small" />,
  },
  formula: {
    label: '수식 (KaTeX)',
    color: 'secondary.main',
    chipColor: 'secondary' as const,
    icon: <FunctionsIcon fontSize="small" />,
  },
  erd: {
    label: 'ERD 다이어그램 (Mermaid)',
    color: 'info.main',
    chipColor: 'info' as const,
    icon: <SchemaIcon fontSize="small" />,
  },
  chart: {
    label: '차트 (Plotly / Mermaid)',
    color: 'success.main',
    chipColor: 'success' as const,
    icon: <BarChartIcon fontSize="small" />,
  },
};

export const StudyBlockItem = memo(function StudyBlockItem({
  block,
  index,
  totalBlocks,
  onChangeContent,
  onMoveUp,
  onMoveDown,
  onDelete,
}: StudyBlockItemProps) {
  const config = BLOCK_CONFIG[block.type] || BLOCK_CONFIG.markdown;

  const handleInsertSymbol = (symbol: string) => {
    onChangeContent((block.content || '') + symbol);
  };

  const handleInsertTrapTemplate = (template: string) => {
    onChangeContent(template);
  };

  const handleInsertErdTemplate = (code: string) => {
    onChangeContent(code);
  };

  const handleInsertChartTemplate = (code: string) => {
    onChangeContent(code);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: (t) => alpha(t.palette.background.paper, 0.9),
        borderColor: (t) => alpha(t.palette.grey[500], 0.2),
        transition: (t) => t.transitions.create(['border-color', 'box-shadow']),
        '&:hover': {
          borderColor: config.color,
        },
      }}
    >
      {/* Block Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1.5,
          borderBottom: (t) => `1px dashed ${alpha(t.palette.divider, 0.6)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={config.icon}
            label={config.label}
            size="small"
            color={config.chipColor}
            variant="soft"
            sx={{ fontWeight: 700, fontSize: 12 }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            #{index + 1}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="위로 이동">
            <span>
              <IconButton size="small" onClick={onMoveUp} disabled={index === 0}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="아래로 이동">
            <span>
              <IconButton size="small" onClick={onMoveDown} disabled={index === totalBlocks - 1}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="블록 삭제">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Block Body according to Type */}
      {block.type === 'markdown' && (
        <Box>
          <MarkdownEditor
            value={block.content}
            onChange={onChangeContent}
            placeholder="개념 설명을 마크다운 형식으로 작성하세요. (표, 링크, 강조, 글자색, 취소선 등 지원)"
            minRows={5}
            hideHeader
          />
        </Box>
      )}

      {block.type === 'trap' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Quick Trap Templates Toolbar */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'warning.main', display: 'block', mb: 0.75 }}
            >
              자주 쓰는 함정 템플릿 클릭 삽입:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {COMMON_TRAP_TEMPLATES.map((tmpl) => (
                <Tooltip key={tmpl.label} title={tmpl.description} arrow>
                  <Chip
                    tabIndex={-1}
                    label={tmpl.label}
                    size="small"
                    clickable
                    variant="outlined"
                    color="warning"
                    onClick={() => handleInsertTrapTemplate(tmpl.template)}
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 1,
                      bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
                      borderColor: (t) => alpha(t.palette.warning.main, 0.3),
                      '&:hover': {
                        bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
                        borderColor: 'warning.main',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Markdown Editor for Trap */}
          <MarkdownEditor
            value={block.content}
            onChange={onChangeContent}
            placeholder="⚠️ 시험 단골 오답 함정, 혼동하기 쉬운 예외 규칙, 착각 vs 정답 비교표 등을 작성하세요."
            minRows={6}
            hideHeader
          />

          {/* Real-time Preview */}
          {block.content && block.content.trim() && (
            <Card
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
                borderColor: (t) => alpha(t.palette.warning.main, 0.3),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: 'warning.main',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  함정 블록 미리보기 (Live Preview)
                </Typography>
              </Box>
              <RichContentRenderer
                content={block.content}
                idPrefix={`study_trap_preview_${index}`}
              />
            </Card>
          )}
        </Box>
      )}

      {block.type === 'formula' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Quick LaTeX Symbol Toolbar */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
            >
              자주 쓰는 수식 기호 클릭 삽입:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COMMON_LATEX_SYMBOLS.map((sym) => (
                <Chip
                  key={sym.label}
                  tabIndex={-1}
                  label={sym.label}
                  size="small"
                  clickable
                  variant="outlined"
                  onClick={() => handleInsertSymbol(sym.code)}
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    height: 22,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: (t) => alpha(t.palette.secondary.main, 0.1),
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
            minRows={2}
            label={`LaTeX 수식 #${index + 1}`}
            value={block.content}
            onChange={onChangeContent}
            placeholder="예: f(x) = \sigma(W x + b) = \frac{1}{1 + e^{-(W x + b)}}"
          />

          <FormulaPreviewCard fText={block.content} />
        </Box>
      )}

      {block.type === 'erd' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Quick ERD Templates */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
            >
              자주 쓰는 ERD 템플릿 클릭 삽입:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COMMON_ERD_TEMPLATES.map((tmpl) => (
                <Chip
                  key={tmpl.label}
                  tabIndex={-1}
                  label={tmpl.label}
                  size="small"
                  clickable
                  variant="outlined"
                  color="info"
                  onClick={() => handleInsertErdTemplate(tmpl.code)}
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    height: 22,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: (t) => alpha(t.palette.info.main, 0.1),
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
            minRows={4}
            label={`ERD 다이어그램 #${index + 1} (Mermaid erDiagram)`}
            value={block.content}
            onChange={onChangeContent}
            placeholder="erDiagram&#10;    USER ||--o{ POST : writes&#10;    USER {&#10;        string id PK&#10;        string name&#10;    }"
          />

          {block.content && block.content.trim() && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                border: (t) => `1px dashed ${alpha(t.palette.info.main, 0.3)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'info.main', display: 'block', mb: 0.5 }}
              >
                ERD 미리보기:
              </Typography>
              <MermaidDiagram chart={block.content} idPrefix={`study_erd_preview_${index}`} />
            </Box>
          )}
        </Box>
      )}

      {block.type === 'chart' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Quick Chart Templates */}
          <Box>
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
                  onClick={() => handleInsertChartTemplate(tmpl.code)}
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
            minRows={4}
            label={`차트 #${index + 1} (Plotly JSON 또는 Mermaid 차트)`}
            value={block.content}
            onChange={onChangeContent}
            placeholder="Plotly JSON 형식 또는 Mermaid 차트 문법을 입력하세요"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: 13,
              },
            }}
          />

          {block.content && block.content.trim() && (
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
                차트 미리보기:
              </Typography>
              <ChartRenderer chart={block.content} idPrefix={`study_chart_preview_${index}`} />
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
});
