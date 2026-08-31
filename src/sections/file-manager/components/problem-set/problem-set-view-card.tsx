import type { Problem } from './types';

import { useState } from 'react';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import CancelIcon from '@mui/icons-material/Cancel';
import SchemaIcon from '@mui/icons-material/Schema';
import { alpha, useTheme } from '@mui/material/styles';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FunctionsIcon from '@mui/icons-material/Functions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

import { KatexMath } from 'src/components/katex';
import { ChartRenderer } from 'src/components/chart';
import { MermaidDiagram } from 'src/components/mermaid';

import { StudyConceptModal } from 'src/sections/study/components/study-concept-modal';

import { isRichTextEmpty, RichContentRenderer } from './rich-content-renderer';

interface ProblemSetViewCardProps {
  problem: Problem;
  problemIndex: number;
  isSubmitted: boolean;
  isRevealed: boolean;
  userSelections: number[];
  onSelectAnswer: (choiceNum: number, isMultiple: boolean) => void;
  onSubmitAnswer: () => void;
  onRevealAnswer: () => void;
}

export function ProblemSetViewCard({
  problem,
  problemIndex,
  isSubmitted,
  isRevealed,
  userSelections,
  onSelectAnswer,
  onSubmitAnswer,
  onRevealAnswer,
}: ProblemSetViewCardProps) {
  const theme = useTheme();

  const [previewConceptId, setPreviewConceptId] = useState<string | null>(null);
  const [previewConceptModalOpen, setPreviewConceptModalOpen] = useState(false);

  const isMultiple = Boolean(problem.isMultipleAnswer);
  const problemFormulas = Array.isArray(problem.formulas)
    ? problem.formulas.filter((f) => f && f.trim())
    : problem.formula && problem.formula.trim()
      ? [problem.formula.trim()]
      : [];
  const problemExplanationFormulas = Array.isArray(problem.explanationFormulas)
    ? problem.explanationFormulas.filter((f: string) => f && f.trim())
    : problem.explanationFormula && problem.explanationFormula.trim()
      ? [problem.explanationFormula.trim()]
      : [];

  const problemErds = Array.isArray(problem.erds)
    ? problem.erds.filter((e) => e && e.trim())
    : problem.erd && problem.erd.trim()
      ? [problem.erd.trim()]
      : [];
  const problemExplanationErds = Array.isArray(problem.explanationErds)
    ? problem.explanationErds.filter((e: string) => e && e.trim())
    : problem.explanationErd && problem.explanationErd.trim()
      ? [problem.explanationErd.trim()]
      : [];

  const problemCharts = Array.isArray(problem.charts)
    ? problem.charts.filter((c) => c && c.trim())
    : problem.chart && problem.chart.trim()
      ? [problem.chart.trim()]
      : [];
  const problemExplanationCharts = Array.isArray(problem.explanationCharts)
    ? problem.explanationCharts.filter((c: string) => c && c.trim())
    : problem.explanationChart && problem.explanationChart.trim()
      ? [problem.explanationChart.trim()]
      : [];

  const correctAnswersList = isMultiple
    ? (problem.answers || []).slice().sort((a, b) => a - b)
    : problem.answer
      ? [problem.answer]
      : [];

  const isLlmMatch = problem.isLlmMatch ?? problem.isLlmMath;
  const isLlmProcessed = problem.isLlmProcessed;

  const isCorrect =
    isSubmitted &&
    (isMultiple
      ? correctAnswersList.length === userSelections.length &&
        correctAnswersList.every(
          (val, idx) => [...userSelections].sort((a, b) => a - b)[idx] === val
        )
      : userSelections[0] === problem.answer);

  return (
    <Card
      key={problemIndex}
      sx={{
        p: 3,
        border: (t) => `solid 1px ${t.vars.palette.divider}`,
        ...(isSubmitted && {
          borderColor: isCorrect ? 'success.main' : 'error.main',
          borderWidth: 2,
        }),
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Problem Number + Hashtags + LLM Status */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
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
                bgcolor: isSubmitted ? (isCorrect ? 'success.main' : 'error.main') : 'text.primary',
                color: 'background.paper',
              }}
            >
              {problemIndex + 1}
            </Box>

            {isSubmitted && (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: isCorrect ? 'success.main' : 'error.main',
                }}
              >
                {isCorrect ? '정답!' : '오답'}
              </Typography>
            )}

            {isLlmProcessed && (
              <Chip
                label="LLM 처리완료"
                size="small"
                color="info"
                variant="soft"
                sx={{ fontWeight: 700, fontSize: 12 }}
              />
            )}

            {isLlmMatch !== undefined && (
              <Chip
                label={isLlmMatch ? 'LLM 일치' : 'LLM 불일치'}
                size="small"
                color={isLlmMatch ? 'success' : 'error'}
                variant="soft"
                sx={{ fontWeight: 700, fontSize: 12 }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 0.5,
              justifyContent: 'flex-end',
            }}
          >
            {problem.hashtags.map((tag, tagIndex) => (
              <Chip
                key={tagIndex}
                label={tag}
                size="small"
                color="primary"
                variant="soft"
                sx={{ fontWeight: 600, fontSize: 12 }}
              />
            ))}
          </Box>
        </Box>

        {/* Question */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {problem.question}
          </Typography>

          {problem.isMultipleAnswer && problem.showMultipleCount !== false && (
            <Chip
              size="small"
              color="warning"
              variant="soft"
              label={`정답 ${(problem.answers || []).length || 2}개`}
              sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
            />
          )}

          {problem.disableChoiceShuffle && (
            <Chip
              size="small"
              color="default"
              variant="soft"
              label="선택지 고정"
              sx={{ fontWeight: 600, height: 22, fontSize: 11, opacity: 0.8 }}
            />
          )}
        </Box>

        {/* Description */}
        {!isRichTextEmpty(problem.description) && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.grey[500], 0.03),
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              '& p': {
                m: 0,
                mb: 1.5,
                fontSize: 14,
                lineHeight: 1.8,
                color: (t) => t.palette.text.secondary,
                whiteSpace: 'pre-wrap',
                minHeight: '1.2em',
                '&:last-child': { mb: 0 },
              },
              '& h1, & h2, & h3': {
                mt: 1.5,
                mb: 0.5,
                fontWeight: 700,
                color: (t) => t.palette.text.secondary,
              },
              '& ul, & ol': {
                pl: 3,
                mb: 1,
                '& li': {
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: (t) => t.palette.text.secondary,
                },
              },
              '& code': {
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: 13,
                fontFamily: 'monospace',
                bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
                color: 'error.main',
              },
              '& pre': {
                p: 1.5,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                overflow: 'auto',
                '& code': {
                  bgcolor: 'transparent',
                  color: (t) => t.palette.text.primary,
                  px: 0,
                  py: 0,
                },
              },
              '& blockquote': {
                m: 0,
                pl: 2,
                borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.text.disabled,
                fontStyle: 'italic',
              },
              '& strong': { fontWeight: 700 },
              '& ruby': {
                display: 'inline-flex',
                flexDirection: 'column-reverse',
                alignItems: 'center',
                verticalAlign: 'baseline',
                mx: 0.35,
                position: 'relative',
                bottom: '-0.15em',
              },
              '& rt': {
                fontSize: '0.75em',
                fontWeight: 700,
                color: (t) => t.palette.primary.main,
                lineHeight: 1.1,
                mb: '1px',
                display: 'block',
                userSelect: 'text',
              },
              '& s, & del': {
                color: 'text.secondary',
                textDecoration: 'line-through',
                textDecorationColor: (t) => t.palette.error.main,
                textDecorationThickness: '1.5px',
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  px: 1.5,
                  py: 1,
                  fontSize: 13,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  '&[align="center"], &[style*="text-align: center"], &[style*="text-align:center"]':
                    {
                      textAlign: 'center',
                    },
                  '&[align="right"], &[style*="text-align: right"], &[style*="text-align:right"]': {
                    textAlign: 'right',
                  },
                  '&[align="left"], &[style*="text-align: left"], &[style*="text-align:left"]': {
                    textAlign: 'left',
                  },
                },
                '& th': {
                  fontWeight: 700,
                  bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                },
                '& th p, & td p': {
                  textAlign: 'inherit',
                  m: 0,
                },
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {problem.description}
            </ReactMarkdown>
          </Box>
        )}

        {/* Formulas */}
        {problemFormulas.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.grey[500], 0.03),
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FunctionsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                수식
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {problemFormulas.map((fText, fIdx) => (
                <Box
                  key={fIdx}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                    boxShadow: (t) => t.customShadows?.z1,
                  }}
                >
                  <KatexMath math={fText} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Problem ERD Diagrams */}
        {problemErds.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.info.main, 0.03),
              border: (t) => `1px solid ${alpha(t.palette.info.main, 0.16)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchemaIcon sx={{ color: 'info.main', fontSize: 20 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'info.main',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                ERD (Entity Relationship Diagram)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {problemErds.map((erdText, erdIdx) => (
                <MermaidDiagram
                  key={erdIdx}
                  chart={erdText}
                  idPrefix={`view_erd_${problemIndex}_${erdIdx}`}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Problem Charts */}
        {problemCharts.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.success.main, 0.03),
              border: (t) => `1px solid ${alpha(t.palette.success.main, 0.16)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon sx={{ color: 'success.main', fontSize: 20 }} />
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {problemCharts.map((chartText, chartIdx) => (
                <ChartRenderer
                  key={chartIdx}
                  chart={chartText}
                  idPrefix={`view_problem_chart_${problemIndex}_${chartIdx}`}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Choices */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {problem.choices.map((choice, cIndex) => {
            const choiceNum = cIndex + 1;
            const isThisCorrect = correctAnswersList.includes(choiceNum);
            const isThisSelected = userSelections.includes(choiceNum);

            let choiceBgColor = 'transparent';
            let choiceBorderColor = 'divider';
            let choiceIcon = isMultiple ? (
              <CheckBoxOutlineBlankIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            );

            if (isSubmitted) {
              if (isThisCorrect) {
                choiceBgColor = alpha(theme.palette.success.main, 0.08);
                choiceBorderColor = theme.palette.success.main;
                choiceIcon = <CheckCircleIcon sx={{ color: 'success.main' }} />;
              } else if (isThisSelected && !isThisCorrect) {
                choiceBgColor = alpha(theme.palette.error.main, 0.08);
                choiceBorderColor = theme.palette.error.main;
                choiceIcon = <CancelIcon sx={{ color: 'error.main' }} />;
              }
            } else if (isThisSelected) {
              choiceIcon = isMultiple ? (
                <CheckBoxIcon color="primary" />
              ) : (
                <RadioButtonCheckedIcon color="primary" />
              );
            }

            return (
              <Box
                key={cIndex}
                onClick={() => !isSubmitted && onSelectAnswer(choiceNum, isMultiple)}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: `1px solid`,
                  borderColor: choiceBorderColor,
                  bgcolor: choiceBgColor,
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: (t) => t.transitions.create(['background-color', 'border-color']),
                  ...(!isSubmitted && {
                    '&:hover': {
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                      borderColor: 'primary.main',
                    },
                  }),
                  ...(isThisSelected &&
                    !isSubmitted && {
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }),
                }}
              >
                <FormControlLabel
                  value={choiceNum}
                  disabled={isSubmitted}
                  control={
                    isMultiple ? (
                      <Checkbox
                        size="small"
                        checked={isThisSelected}
                        icon={isSubmitted && isThisCorrect ? choiceIcon : undefined}
                        checkedIcon={isSubmitted ? choiceIcon : undefined}
                        sx={{
                          ...(isSubmitted &&
                            isThisCorrect && {
                              color: 'success.main',
                            }),
                        }}
                      />
                    ) : (
                      <Radio
                        size="small"
                        checked={isThisSelected}
                        icon={isSubmitted && isThisCorrect ? choiceIcon : undefined}
                        checkedIcon={isSubmitted ? choiceIcon : undefined}
                        sx={{
                          ...(isSubmitted &&
                            isThisCorrect && {
                              color: 'success.main',
                            }),
                        }}
                      />
                    )
                  }
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        py: 0.25,
                        width: '100%',
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          fontWeight: isThisSelected || (isSubmitted && isThisCorrect) ? 700 : 400,
                          flexShrink: 0,
                          mt: 0.2,
                        }}
                      >
                        {choiceNum}.
                      </Typography>
                      <Box sx={{ flexGrow: 1, width: '100%' }}>
                        <RichContentRenderer
                          content={choice}
                          idPrefix={`view_choice_${problemIndex}_${cIndex}`}
                          sx={{
                            fontWeight:
                              isThisSelected || (isSubmitted && isThisCorrect) ? 700 : 400,
                          }}
                        />
                      </Box>
                    </Box>
                  }
                  sx={{
                    m: 0,
                    width: '100%',
                    pointerEvents: 'none',
                    '& .MuiFormControlLabel-label': { flexGrow: 1 },
                  }}
                />

                {/* Choice Extra Description */}
                {!isRichTextEmpty(problem.choiceDescriptions?.[cIndex]) && (
                  <Box
                    sx={{
                      pl: 4.5,
                      pb: 1,
                      color: 'text.secondary',
                      fontSize: 13,
                    }}
                  >
                    <RichContentRenderer
                      content={problem.choiceDescriptions?.[cIndex] || ''}
                      idPrefix={`view_choice_desc_${problemIndex}_${cIndex}`}
                    />
                  </Box>
                )}

                {/* Choice Extra Formulas */}
                {problem.choiceFormulas?.[cIndex] && problem.choiceFormulas[cIndex].length > 0 && (
                  <Box sx={{ pl: 4.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {problem.choiceFormulas[cIndex].map((fText, fIdx) => (
                      <Box
                        key={fIdx}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                        }}
                      >
                        <KatexMath math={fText} />
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Choice Extra ERDs */}
                {problem.choiceErds?.[cIndex] && problem.choiceErds[cIndex].length > 0 && (
                  <Box sx={{ pl: 4.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {problem.choiceErds[cIndex].map((erdText, erdIdx) => (
                      <MermaidDiagram
                        key={erdIdx}
                        chart={erdText}
                        idPrefix={`view_choice_erd_${problemIndex}_${cIndex}_${erdIdx}`}
                      />
                    ))}
                  </Box>
                )}

                {/* Choice Extra Charts */}
                {problem.choiceCharts?.[cIndex] && problem.choiceCharts[cIndex].length > 0 && (
                  <Box sx={{ pl: 4.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {problem.choiceCharts[cIndex].map((chartText, chartIdx) => (
                      <ChartRenderer
                        key={chartIdx}
                        chart={chartText}
                        idPrefix={`view_choice_chart_${problemIndex}_${cIndex}_${chartIdx}`}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, justifyContent: 'flex-end' }}>
          {!isSubmitted && userSelections.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmitAnswer}
              sx={{ fontWeight: 700 }}
            >
              제출하기
            </Button>
          )}
          <Button
            variant={isRevealed ? 'contained' : 'outlined'}
            color="info"
            startIcon={<VisibilityIcon />}
            onClick={onRevealAnswer}
            sx={{ fontWeight: 700 }}
          >
            {isRevealed ? '정답 숨기기' : '정답 보기'}
          </Button>
        </Box>

        {/* Answer Reveal Section */}
        <Collapse in={isRevealed}>
          <Box
            sx={{
              mt: 1,
              p: 2.5,
              borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
              border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.16)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            {/* Correct Answer */}
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                정답:{' '}
                {correctAnswersList.length > 0 ? `${correctAnswersList.join(', ')}번` : '미지정'}
              </Typography>
            </Box>

            {/* LLM Info in Reveal Section */}
            {(problem.llmPredictedAnswer !== undefined ||
              isLlmMatch !== undefined ||
              isLlmProcessed !== undefined ||
              Boolean(problem.llmKeyConcept)) && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.06),
                  border: (t) => `1px solid ${alpha(t.palette.info.main, 0.16)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'info.main' }}>
                    🤖 LLM 분석 정보
                  </Typography>
                  {isLlmProcessed && (
                    <Chip
                      size="small"
                      label="처리완료"
                      color="info"
                      variant="soft"
                      sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                    />
                  )}
                  {problem.llmPredictedAnswer !== undefined && (
                    <Chip
                      size="small"
                      label={`예측 정답: ${problem.llmPredictedAnswer}번`}
                      color={isLlmMatch ? 'success' : 'info'}
                      variant="soft"
                      sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                    />
                  )}
                  {isLlmMatch !== undefined && (
                    <Chip
                      size="small"
                      label={isLlmMatch ? '정답 일치' : '정답 불일치'}
                      color={isLlmMatch ? 'success' : 'error'}
                      variant="soft"
                      sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                    />
                  )}
                </Box>
                {problem.llmKeyConcept && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', mr: 0.5 }}>
                      핵심 개념:
                    </Box>
                    {problem.llmKeyConcept}
                  </Typography>
                )}
              </Box>
            )}

            {!isRichTextEmpty(problem.explanation) && (
              <Box
                sx={{
                  '& p': {
                    m: 0,
                    mb: 1.5,
                    fontSize: 14,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    minHeight: '1.2em',
                    '&:last-child': { mb: 0 },
                  },
                  '& h1, & h2, & h3': { mt: 1.5, mb: 0.5, fontWeight: 700 },
                  '& ul, & ol': { pl: 3, mb: 1, '& li': { fontSize: 14, lineHeight: 1.8 } },
                  '& code': {
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
                    color: (t) => t.palette.error.main,
                  },
                  '& pre': {
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    overflow: 'auto',
                    '& code': {
                      bgcolor: 'transparent',
                      color: (t) => t.palette.text.primary,
                      px: 0,
                      py: 0,
                    },
                  },
                  '& blockquote': {
                    m: 0,
                    pl: 2,
                    borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
                    color: (t) => t.palette.text.disabled,
                    fontStyle: 'italic',
                  },
                  '& strong': { fontWeight: 700 },
                  '& ruby': {
                    display: 'inline-flex',
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                    verticalAlign: 'baseline',
                    mx: 0.35,
                    position: 'relative',
                    bottom: '-0.15em',
                  },
                  '& rt': {
                    fontSize: '0.75em',
                    fontWeight: 700,
                    color: (t) => t.palette.primary.main,
                    lineHeight: 1.1,
                    mb: '1px',
                    display: 'block',
                    userSelect: 'text',
                  },
                  '& s, & del': {
                    color: 'text.secondary',
                    textDecoration: 'line-through',
                    textDecorationColor: (t) => t.palette.error.main,
                    textDecorationThickness: '1.5px',
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    my: 1.5,
                    '& td, & th': {
                      border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.24)}`,
                      px: 1.5,
                      py: 1,
                      fontSize: 14,
                      '&[align="center"], &[style*="text-align: center"], &[style*="text-align:center"]':
                        {
                          textAlign: 'center',
                        },
                      '&[align="right"], &[style*="text-align: right"], &[style*="text-align:right"]':
                        {
                          textAlign: 'right',
                        },
                      '&[align="left"], &[style*="text-align: left"], &[style*="text-align:left"]':
                        {
                          textAlign: 'left',
                        },
                    },
                    '& th': {
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                      fontWeight: 700,
                    },
                    '& th p, & td p': {
                      textAlign: 'inherit',
                      m: 0,
                    },
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}
                >
                  해설
                </Typography>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {problem.explanation}
                </ReactMarkdown>
              </Box>
            )}

            {/* Explanation Formulas */}
            {problemExplanationFormulas.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.grey[500], 0.03),
                  border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FunctionsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    해설 수식
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {problemExplanationFormulas.map((fText: string, fIdx: number) => (
                    <Box
                      key={fIdx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                        boxShadow: (t) => t.customShadows?.z1,
                      }}
                    >
                      <KatexMath math={fText} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Explanation ERD Diagrams */}
            {problemExplanationErds.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.03),
                  border: (t) => `1px solid ${alpha(t.palette.info.main, 0.16)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchemaIcon sx={{ color: 'info.main', fontSize: 20 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'info.main',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    해설 ERD (Entity Relationship Diagram)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {problemExplanationErds.map((erdText: string, erdIdx: number) => (
                    <MermaidDiagram
                      key={erdIdx}
                      chart={erdText}
                      idPrefix={`view_exp_erd_${problemIndex}_${erdIdx}`}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Explanation Charts */}
            {problemExplanationCharts.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.success.main, 0.03),
                  border: (t) => `1px solid ${alpha(t.palette.success.main, 0.16)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'success.main',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    해설 차트 (Plotly / Mermaid)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {problemExplanationCharts.map((chartText: string, chartIdx: number) => (
                    <ChartRenderer
                      key={chartIdx}
                      chart={chartText}
                      idPrefix={`view_exp_chart_${problemIndex}_${chartIdx}`}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Choice Explanations */}
            {(() => {
              const hasAnyChoiceExplanation = (problem.choices || []).some((_, cIndex) => {
                const exp = problem.choiceExplanations?.[cIndex];
                const expDesc = problem.choiceExplanationDescriptions?.[cIndex];
                const expFormulas = problem.choiceExplanationFormulas?.[cIndex];
                const expErds = problem.choiceExplanationErds?.[cIndex];
                const expCharts = problem.choiceExplanationCharts?.[cIndex];

                return (
                  !isRichTextEmpty(exp) ||
                  !isRichTextEmpty(expDesc) ||
                  (expFormulas && expFormulas.length > 0) ||
                  (expErds && expErds.length > 0) ||
                  (expCharts && expCharts.length > 0)
                );
              });

              if (!hasAnyChoiceExplanation) return null;

              return (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5 }}
                  >
                    객관식별 설명
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {(problem.choices || []).map((_, cIndex) => {
                      const exp = problem.choiceExplanations?.[cIndex] || '';
                      const expDesc = problem.choiceExplanationDescriptions?.[cIndex] || '';
                      const expFormulas = problem.choiceExplanationFormulas?.[cIndex] || [];
                      const expErds = problem.choiceExplanationErds?.[cIndex] || [];
                      const expCharts = problem.choiceExplanationCharts?.[cIndex] || [];

                      const hasThisChoiceExp =
                        !isRichTextEmpty(exp) ||
                        !isRichTextEmpty(expDesc) ||
                        expFormulas.length > 0 ||
                        expErds.length > 0 ||
                        expCharts.length > 0;

                      if (!hasThisChoiceExp) return null;

                      const isThisAnswer = isMultiple
                        ? correctAnswersList.includes(cIndex + 1)
                        : problem.answer === cIndex + 1;

                      return (
                        <Box
                          key={cIndex}
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 1.5,
                            alignItems: 'flex-start',
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: (t) => alpha(t.palette.grey[500], 0.03),
                            border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: 26,
                              height: 26,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              bgcolor: isThisAnswer ? 'success.main' : 'text.disabled',
                              color: 'background.paper',
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {cIndex + 1}
                          </Box>
                          <Box
                            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
                          >
                            {/* Choice basic explanation */}
                            {!isRichTextEmpty(exp) && (
                              <RichContentRenderer
                                content={exp}
                                idPrefix={`view_choice_exp_${problemIndex}_${cIndex}`}
                                sx={{ lineHeight: 1.7 }}
                              />
                            )}

                            {/* Choice Explanation Extra Description */}
                            {!isRichTextEmpty(expDesc) && (
                              <Box
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: 13,
                                }}
                              >
                                <RichContentRenderer
                                  content={expDesc}
                                  idPrefix={`view_choice_exp_desc_${problemIndex}_${cIndex}`}
                                />
                              </Box>
                            )}

                            {/* Choice Explanation Extra Formulas */}
                            {expFormulas.length > 0 && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {expFormulas.map((fText, fIdx) => (
                                  <Box
                                    key={fIdx}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      border: (t) =>
                                        `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                                    }}
                                  >
                                    <KatexMath math={fText} />
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {/* Choice Explanation Extra ERDs */}
                            {expErds.length > 0 && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {expErds.map((erdText, erdIdx) => (
                                  <MermaidDiagram
                                    key={erdIdx}
                                    chart={erdText}
                                    idPrefix={`view_exp_erd_${problemIndex}_${cIndex}_${erdIdx}`}
                                  />
                                ))}
                              </Box>
                            )}

                            {/* Choice Explanation Extra Charts */}
                            {expCharts.length > 0 && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {expCharts.map((chartText, chartIdx) => (
                                  <ChartRenderer
                                    key={chartIdx}
                                    chart={chartText}
                                    idPrefix={`view_exp_chart_${problemIndex}_${cIndex}_${chartIdx}`}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })()}

            {/* Related Study Concepts */}
            {problem.conceptLinks && problem.conceptLinks.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBookRoundedIcon color="primary" sx={{ fontSize: 20 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    관련 개념 (Study Note)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {problem.conceptLinks.map((link, lIdx) => (
                    <Chip
                      key={link.id || lIdx}
                      icon={<MenuBookRoundedIcon fontSize="small" />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                            {link.title}
                          </Typography>
                          {link.fileName && (
                            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 11 }}>
                              ({link.fileName})
                            </Typography>
                          )}
                        </Box>
                      }
                      clickable
                      color="primary"
                      onClick={() => {
                        setPreviewConceptId(link.id);
                        setPreviewConceptModalOpen(true);
                      }}
                      sx={{
                        py: 2.2,
                        px: 1,
                        fontWeight: 700,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        '&:hover': {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.16),
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Study Concept Details Modal */}
      <StudyConceptModal
        open={previewConceptModalOpen}
        onClose={() => {
          setPreviewConceptModalOpen(false);
          setPreviewConceptId(null);
        }}
        conceptId={previewConceptId}
      />
    </Card>
  );
}
