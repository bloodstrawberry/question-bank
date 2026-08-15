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
import SchemaIcon from '@mui/icons-material/Schema';
import DeleteIcon from '@mui/icons-material/Delete';

import { MermaidDiagram } from 'src/components/mermaid';

import { FastTextField } from './fast-text-field';
import { type ERDTemplate, COMMON_ERD_TEMPLATES } from './constants';

export { type ERDTemplate, COMMON_ERD_TEMPLATES };

interface ProblemEditorErdsProps {
  title?: string;
  erds: string[];
  onAddErd: () => void;
  onChangeErd: (erdIndex: number, value: string) => void;
  onRemoveErd: (erdIndex: number) => void;
  onInsertTemplate: (erdIndex: number, template: string) => void;
  emptyPlaceholderText?: string;
  labelPrefix?: string;
  hideHeader?: boolean;
}

export const ProblemEditorErds = memo(function ProblemEditorErds({
  title = 'ERD (Entity Relationship Diagram)',
  erds = [],
  onAddErd,
  onChangeErd,
  onRemoveErd,
  onInsertTemplate,
  emptyPlaceholderText = '등록된 ERD 다이어그램이 없습니다.',
  labelPrefix = 'ERD 다이어그램',
  hideHeader = false,
}: ProblemEditorErdsProps) {
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
            <SchemaIcon color="info" sx={{ fontSize: 22 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {erds.length > 0 && (
              <Chip
                label={`${erds.length}개`}
                size="small"
                color="info"
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Box>

          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color="info"
            startIcon={<AddIcon />}
            onClick={onAddErd}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            {title} 추가
          </Button>
        </Box>
      )}

      {erds.length === 0 ? (
        <Box
          onClick={onAddErd}
          sx={{
            p: 2.5,
            textAlign: 'center',
            borderRadius: 1.5,
            border: (t) => `2px dashed ${alpha(t.palette.info.main, 0.2)}`,
            bgcolor: (t) => alpha(t.palette.info.main, 0.02),
            cursor: 'pointer',
            transition: (t) => t.transitions.create(['background-color', 'border-color']),
            '&:hover': {
              bgcolor: (t) => alpha(t.palette.info.main, 0.06),
              borderColor: 'info.main',
            },
          }}
        >
          <SchemaIcon sx={{ fontSize: 28, color: 'info.main', mb: 0.5, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {emptyPlaceholderText}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
            &quot;+ {title} 추가&quot; 버튼을 누르거나 여기를 클릭하여 ERD 다이어그램(Mermaid
            구문)을 입력하세요.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {erds.map((erdText, erdIndex) => (
            <Card
              key={erdIndex}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {labelPrefix} #{erdIndex + 1}
                </Typography>
                <IconButton
                  size="small"
                  tabIndex={-1}
                  color="error"
                  onClick={() => onRemoveErd(erdIndex)}
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
                      onClick={() => onInsertTemplate(erdIndex, tmpl.code)}
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
                minRows={3}
                label={`${labelPrefix} #${erdIndex + 1} (Mermaid erDiagram)`}
                value={erdText}
                onChange={(val) => onChangeErd(erdIndex, val)}
                placeholder={
                  'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    CUSTOMER {\n        string name\n    }'
                }
                sx={{ mb: 1.5 }}
              />

              {/* Live Preview Card */}
              {erdText && erdText.trim() && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}
                  >
                    ERD 미리보기:
                  </Typography>
                  <MermaidDiagram chart={erdText} idPrefix={`preview_erd_${erdIndex}`} />
                </Box>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
});
