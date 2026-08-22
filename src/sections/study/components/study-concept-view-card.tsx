'use client';

import { memo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';

import { KatexMath } from 'src/components/katex';
import { MermaidDiagram } from 'src/components/mermaid';
import { ChartRenderer } from 'src/components/chart';
import {
  RichContentRenderer,
  isRichTextEmpty,
} from 'src/sections/file-manager/components/problem-set/rich-content-renderer';

import type { StudyConcept } from '../types';

// ----------------------------------------------------------------------

interface StudyConceptViewCardProps {
  concept: StudyConcept;
  conceptIndex: number;
  totalConcepts: number;
}

export const StudyConceptViewCard = memo(function StudyConceptViewCard({
  concept,
  conceptIndex,
  totalConcepts,
}: StudyConceptViewCardProps) {
  const blocks = concept.blocks || [];
  const hashtags = concept.hashtags || [];

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 4.5 },
        borderRadius: 2.5,
        border: (t) => `1px solid ${t.vars.palette.divider}`,
        boxShadow: (t) => t.customShadows?.card,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header: Concept Index & Hashtags */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.4)}`,
              }}
            >
              {conceptIndex + 1}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              Concept #{conceptIndex + 1} / {totalConcepts}
            </Typography>
          </Box>

          {hashtags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                justifyContent: 'flex-end',
              }}
            >
              {hashtags.map((tag, tIndex) => (
                <Chip
                  key={tIndex}
                  label={`#${tag.replace(/^#/, '')}`}
                  size="small"
                  color="primary"
                  variant="soft"
                  sx={{ fontWeight: 700, fontSize: 12, borderRadius: 1 }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Concept Title */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              lineHeight: 1.4,
              color: 'text.primary',
              letterSpacing: -0.5,
            }}
          >
            {concept.title || '제목 없음'}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Sequential Blocks */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {blocks.map((block, bIndex) => {
            if (block.type === 'markdown') {
              if (isRichTextEmpty(block.content)) return null;

              return (
                <Box
                  key={block.id || bIndex}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.03),
                    border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <ArticleIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      개념 설명
                    </Typography>
                  </Box>
                  <RichContentRenderer
                    content={block.content}
                    idPrefix={`study_view_${conceptIndex}_${bIndex}`}
                  />
                </Box>
              );
            }

            if (block.type === 'formula') {
              if (!block.content || !block.content.trim()) return null;

              return (
                <Card
                  key={block.id || bIndex}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.03),
                    borderColor: (t) => alpha(t.palette.secondary.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <FunctionsIcon color="secondary" sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'secondary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      수식 (KaTeX)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
                      display: 'flex',
                      justifyContent: 'center',
                      overflowX: 'auto',
                    }}
                  >
                    <KatexMath math={block.content} />
                  </Box>
                </Card>
              );
            }

            if (block.type === 'erd') {
              if (!block.content || !block.content.trim()) return null;

              return (
                <Card
                  key={block.id || bIndex}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.info.main, 0.03),
                    borderColor: (t) => alpha(t.palette.info.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SchemaIcon color="info" sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'info.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      ERD 다이어그램 (Mermaid)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
                      display: 'flex',
                      justifyContent: 'center',
                      overflowX: 'auto',
                    }}
                  >
                    <MermaidDiagram
                      chart={block.content}
                      idPrefix={`study_view_erd_${conceptIndex}_${bIndex}`}
                    />
                  </Box>
                </Card>
              );
            }

            if (block.type === 'chart') {
              if (!block.content || !block.content.trim()) return null;

              return (
                <Card
                  key={block.id || bIndex}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.success.main, 0.03),
                    borderColor: (t) => alpha(t.palette.success.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <BarChartIcon color="success" sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'success.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      차트 (Plotly / Mermaid)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
                      display: 'flex',
                      justifyContent: 'center',
                      overflowX: 'auto',
                    }}
                  >
                    <ChartRenderer
                      chart={block.content}
                      idPrefix={`study_view_chart_${conceptIndex}_${bIndex}`}
                    />
                  </Box>
                </Card>
              );
            }

            return null;
          })}
        </Box>
      </Box>
    </Card>
  );
});
