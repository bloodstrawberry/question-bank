'use client';

import { memo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { FastTextField } from 'src/sections/file-manager/components/problem-set/fast-text-field';
import { ProblemEditorHashtags } from 'src/sections/file-manager/components/problem-set/problem-editor-hashtags';

import { StudyBlockItem } from './study-block-item';
import type { StudyConcept, StudyBlockType } from '../types';

// ----------------------------------------------------------------------

interface StudyConceptEditorCardProps {
  concept: StudyConcept;
  conceptIndex: number;
  totalConcepts: number;
  hashtagInput: string;
  onHashtagInputChange: (val: string) => void;
  onAddHashtag: (tag: string) => void;
  onRemoveHashtag: (tagIndex: number) => void;
  onUpdateTitle: (title: string) => void;
  onAddBlock: (type: StudyBlockType) => void;
  onChangeBlockContent: (blockIndex: number, content: string) => void;
  onMoveBlockUp: (blockIndex: number) => void;
  onMoveBlockDown: (blockIndex: number) => void;
  onDeleteBlock: (blockIndex: number) => void;
  onDuplicateConcept: (index: number) => void;
  onRemoveConcept: (index: number) => void;
}

export const StudyConceptEditorCard = memo(function StudyConceptEditorCard({
  concept,
  conceptIndex,
  totalConcepts,
  hashtagInput,
  onHashtagInputChange,
  onAddHashtag,
  onRemoveHashtag,
  onUpdateTitle,
  onAddBlock,
  onChangeBlockContent,
  onMoveBlockUp,
  onMoveBlockDown,
  onDeleteBlock,
  onDuplicateConcept,
  onRemoveConcept,
}: StudyConceptEditorCardProps) {
  const blocks = concept.blocks || [];

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 2.5,
        border: (t) => `1px solid ${t.vars.palette.divider}`,
        boxShadow: (t) => t.customShadows?.card,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header: Concept Index + Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: (t) => `1px solid ${t.vars.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 15,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.4)}`,
              }}
            >
              {conceptIndex + 1}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                개념 #{conceptIndex + 1}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                총 {totalConcepts}개 중 {conceptIndex + 1}번째
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="이 개념 복제">
              <IconButton
                size="small"
                onClick={() => onDuplicateConcept(conceptIndex)}
                sx={{
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                  color: 'primary.main',
                  '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.16) },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {totalConcepts > 1 && (
              <Tooltip title="이 개념 삭제">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemoveConcept(conceptIndex)}
                  sx={{
                    bgcolor: (t) => alpha(t.palette.error.main, 0.08),
                    '&:hover': { bgcolor: (t) => alpha(t.palette.error.main, 0.16) },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Concept Title Input */}
        <Box>
          <FastTextField
            fullWidth
            label="개념 제목 (Title)"
            value={concept.title}
            onChange={onUpdateTitle}
            placeholder="예: 정규화 (1NF, 2NF, 3NF, BCNF)의 개념 및 이상현상"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              style: { fontSize: '1.15rem', fontWeight: 700 },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            * 여기서 작성한 제목은 Question Drive의 문제 에디터에서 링크로 연결할 수 있습니다.
          </Typography>
        </Box>

        {/* Hashtags Section */}
        <ProblemEditorHashtags
          hashtags={concept.hashtags || []}
          hashtagInput={hashtagInput}
          onHashtagInputChange={onHashtagInputChange}
          onAddHashtag={onAddHashtag}
          onRemoveHashtag={onRemoveHashtag}
        />

        {/* Content Blocks Section */}
        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                콘텐츠 블록
              </Typography>
              <Chip
                label={`${blocks.length}개`}
                size="small"
                color="primary"
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              블록을 원하는 순서대로 자유롭게 구성할 수 있습니다.
            </Typography>
          </Box>

          {/* Sequential Block List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {blocks.map((block, bIndex) => (
              <StudyBlockItem
                key={block.id || bIndex}
                block={block}
                index={bIndex}
                totalBlocks={blocks.length}
                onChangeContent={(content) => onChangeBlockContent(bIndex, content)}
                onMoveUp={() => onMoveBlockUp(bIndex)}
                onMoveDown={() => onMoveBlockDown(bIndex)}
                onDelete={() => onDeleteBlock(bIndex)}
              />
            ))}
          </Box>

          {/* Add Block Toolbar */}
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              border: (t) => `2px dashed ${alpha(t.palette.primary.main, 0.25)}`,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              + 원하는 콘텐츠 블록을 추가하세요
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<ArticleIcon />}
                onClick={() => onAddBlock('markdown')}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              >
                개념 설명 (Markdown)
              </Button>

              <Button
                variant="contained"
                color="warning"
                startIcon={<WarningAmberRoundedIcon />}
                onClick={() => onAddBlock('trap')}
                sx={{
                  fontWeight: 700,
                  borderRadius: 1.5,
                  boxShadow: (t) => t.customShadows?.warning,
                }}
              >
                시험 단골 함정 (Trap)
              </Button>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<FunctionsIcon />}
                onClick={() => onAddBlock('formula')}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              >
                수식 (KaTeX)
              </Button>

              <Button
                variant="contained"
                color="info"
                startIcon={<SchemaIcon />}
                onClick={() => onAddBlock('erd')}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              >
                ERD (Mermaid)
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<BarChartIcon />}
                onClick={() => onAddBlock('chart')}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              >
                차트 (Plotly/Mermaid)
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
});
