import { memo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FunctionsIcon from '@mui/icons-material/Functions';

import { FastTextField } from './fast-text-field';
import { COMMON_LATEX_SYMBOLS } from './constants';
import { FormulaPreviewCard } from './formula-preview-card';

interface ProblemEditorFormulasProps {
  title?: string;
  formulas: string[];
  onAddFormula: () => void;
  onChangeFormula: (formulaIndex: number, value: string) => void;
  onRemoveFormula: (formulaIndex: number) => void;
  onInsertSymbol: (formulaIndex: number, symbol: string) => void;
  emptyPlaceholderText?: string;
  labelPrefix?: string;
  hideHeader?: boolean;
}

export const ProblemEditorFormulas = memo(function ProblemEditorFormulas({
  title = '수식 (KaTeX)',
  formulas = [],
  onAddFormula,
  onChangeFormula,
  onRemoveFormula,
  onInsertSymbol,
  emptyPlaceholderText = '등록된 수식이 없습니다.',
  labelPrefix = 'LaTeX 수식',
  hideHeader = false,
}: ProblemEditorFormulasProps) {
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
            <FunctionsIcon color="primary" sx={{ fontSize: 22 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {formulas.length > 0 && (
              <Chip
                label={`${formulas.length}개`}
                size="small"
                color="primary"
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Box>

          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddFormula}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            {title} 추가
          </Button>
        </Box>
      )}

      {formulas.length === 0 ? (
        <Box
          onClick={onAddFormula}
          sx={{
            p: 2.5,
            textAlign: 'center',
            borderRadius: 1.5,
            border: (t) => `2px dashed ${alpha(t.palette.primary.main, 0.2)}`,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
            cursor: 'pointer',
            transition: (t) => t.transitions.create(['background-color', 'border-color']),
            '&:hover': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              borderColor: 'primary.main',
            },
          }}
        >
          <FunctionsIcon sx={{ fontSize: 28, color: 'primary.main', mb: 0.5, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {emptyPlaceholderText}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
            &quot;+ {title} 추가&quot; 버튼을 누르거나 여기를 클릭하여 LaTeX 수식을 입력하세요.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formulas.map((fText, fIndex) => (
            <Card
              key={fIndex}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {labelPrefix} #{fIndex + 1}
                </Typography>
                <IconButton
                  size="small"
                  tabIndex={-1}
                  color="error"
                  onClick={() => onRemoveFormula(fIndex)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Quick Symbol Toolbar */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  자주 쓰는 기호 클릭 삽입:
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
                      onClick={() => onInsertSymbol(fIndex, sym.code)}
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
              </Box>

              <FastTextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label={`${labelPrefix} #${fIndex + 1}`}
                value={fText}
                onChange={(val) => onChangeFormula(fIndex, val)}
                placeholder="예: \int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
                sx={{ mb: 1.5 }}
              />

              {/* Live Preview Box */}
              <FormulaPreviewCard fText={fText} />
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
});
