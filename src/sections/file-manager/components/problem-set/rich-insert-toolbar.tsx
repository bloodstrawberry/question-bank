'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import FunctionsIcon from '@mui/icons-material/Functions';

import { COMMON_ERD_TEMPLATES, COMMON_LATEX_SYMBOLS } from './constants';

interface RichInsertToolbarProps {
  onInsert: (textToInsert: string) => void;
  size?: 'small' | 'medium';
}

const MARKDOWN_OPTIONS = [
  { label: '강조 (Bold)', code: '**강조**' },
  { label: '기울임 (Italic)', code: '*기울임*' },
  { label: '코드 (Inline Code)', code: '`코드`' },
  { label: '취소선 (Strikethrough)', code: '~~취소선~~' },
  { label: '오답 교정 (취소선+정답)', code: '<ruby><s>오답</s><rt>정답</rt></ruby>' },
  { label: '링크 (Link)', code: '[제목](https://)' },
  { label: '표 (Table)', code: '\n| 항목 | 내용 |\n| --- | --- |\n| 값1 | 값2 |\n' },
];

export function RichInsertToolbar({ onInsert, size = 'small' }: RichInsertToolbarProps) {
  const [mdAnchorEl, setMdAnchorEl] = useState<null | HTMLElement>(null);
  const [formulaAnchorEl, setFormulaAnchorEl] = useState<null | HTMLElement>(null);
  const [erdAnchorEl, setErdAnchorEl] = useState<null | HTMLElement>(null);

  const handleInsert = (text: string) => {
    onInsert(text);
    setMdAnchorEl(null);
    setFormulaAnchorEl(null);
    setErdAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* Markdown Button */}
      <Tooltip title="마크다운 서식 추가">
        <IconButton
          size={size}
          onClick={(e) => setMdAnchorEl(e.currentTarget)}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              color: 'primary.main',
            },
          }}
        >
          <ArticleIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>
      </Tooltip>

      {/* Formula Button */}
      <Tooltip title="LaTeX 수식 추가">
        <IconButton
          size={size}
          color="primary"
          onClick={(e) => setFormulaAnchorEl(e.currentTarget)}
          sx={{
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.12) },
          }}
        >
          <FunctionsIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>
      </Tooltip>

      {/* ERD Button */}
      <Tooltip title="ERD 다이어그램 추가">
        <IconButton
          size={size}
          color="info"
          onClick={(e) => setErdAnchorEl(e.currentTarget)}
          sx={{
            '&:hover': { bgcolor: (t) => alpha(t.palette.info.main, 0.12) },
          }}
        >
          <SchemaIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>
      </Tooltip>

      {/* Markdown Menu */}
      <Menu
        anchorEl={mdAnchorEl}
        open={Boolean(mdAnchorEl)}
        onClose={() => setMdAnchorEl(null)}
        sx={{
          '& .MuiMenu-paper': {
            borderRadius: 1.5,
            minWidth: 180,
            boxShadow: (t) => t.customShadows?.dropdown,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
            마크다운 서식 선택
          </Typography>
        </Box>
        {MARKDOWN_OPTIONS.map((opt) => (
          <MenuItem key={opt.label} onClick={() => handleInsert(opt.code)} sx={{ fontSize: 13 }}>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Formula Popover */}
      <Popover
        anchorEl={formulaAnchorEl}
        open={Boolean(formulaAnchorEl)}
        onClose={() => setFormulaAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPopover-paper': {
            p: 2,
            maxWidth: 320,
            borderRadius: 1.5,
            boxShadow: (t) => t.customShadows?.dropdown,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
          자주 쓰는 LaTeX 수식 삽입
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {COMMON_LATEX_SYMBOLS.map((sym) => (
            <Chip
              key={sym.label}
              label={sym.label}
              size="small"
              clickable
              variant="outlined"
              color="primary"
              onClick={() => handleInsert(` $${sym.code}$ `)}
              sx={{
                fontSize: 11,
                fontWeight: 600,
                height: 22,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                },
              }}
            />
          ))}
        </Box>
      </Popover>

      {/* ERD Popover */}
      <Popover
        anchorEl={erdAnchorEl}
        open={Boolean(erdAnchorEl)}
        onClose={() => setErdAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPopover-paper': {
            p: 2,
            maxWidth: 340,
            borderRadius: 1.5,
            boxShadow: (t) => t.customShadows?.dropdown,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'info.main' }}>
          자주 쓰는 ERD 템플릿 삽입
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {COMMON_ERD_TEMPLATES.map((tmpl) => (
            <Chip
              key={tmpl.label}
              label={tmpl.label}
              size="small"
              clickable
              variant="outlined"
              color="info"
              onClick={() => handleInsert(`\n\nerDiagram\n    ${tmpl.code}\n`)}
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
      </Popover>
    </Box>
  );
}

export default RichInsertToolbar;
