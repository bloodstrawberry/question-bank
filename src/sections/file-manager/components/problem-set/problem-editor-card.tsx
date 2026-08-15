import type { Problem } from './types';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import { MarkdownEditor } from 'src/components/markdown-editor';

import { FastTextField } from './fast-text-field';
import { ProblemEditorErds } from './problem-editor-erds';
import { ProblemEditorCharts } from './problem-editor-charts';
import { RichContentRenderer } from './rich-content-renderer';
import { ProblemEditorChoices } from './problem-editor-choices';
import { ProblemEditorHashtags } from './problem-editor-hashtags';
import { ProblemEditorFormulas } from './problem-editor-formulas';
import { ProblemEditorAnswerSelect } from './problem-editor-answer-select';
import { ProblemEditorCollapsibleSection } from './problem-editor-collapsible-section';

type SectionKey =
  | 'description'
  | 'formulas'
  | 'erds'
  | 'charts'
  | 'explanationFormulas'
  | 'explanationErds'
  | 'explanationCharts';

const LOCAL_STORAGE_KEY = 'problem_editor_expanded_sections';

interface ProblemEditorCardProps {
  problem: Problem;
  problemIndex: number;
  totalProblems: number;
  hashtagInput: string;
  onHashtagInputChange: (val: string) => void;
  onUpdateProblem: (updates: Partial<Problem>) => void;
  onDuplicateProblem: (index: number) => void;
  onRemoveProblem: (index: number) => void;
  onAddHashtag: (tag: string) => void;
  onRemoveHashtag: (tagIndex: number) => void;
  onAddFormula: () => void;
  onChangeFormula: (formulaIndex: number, value: string) => void;
  onRemoveFormula: (formulaIndex: number) => void;
  onInsertSymbol: (formulaIndex: number, symbol: string) => void;
  onAddExplanationFormula: () => void;
  onChangeExplanationFormula: (formulaIndex: number, value: string) => void;
  onRemoveExplanationFormula: (formulaIndex: number) => void;
  onInsertExplanationSymbol: (formulaIndex: number, symbol: string) => void;
  onAddErd: () => void;
  onChangeErd: (erdIndex: number, value: string) => void;
  onRemoveErd: (erdIndex: number) => void;
  onInsertErdTemplate: (erdIndex: number, template: string) => void;
  onAddExplanationErd: () => void;
  onChangeExplanationErd: (erdIndex: number, value: string) => void;
  onRemoveExplanationErd: (erdIndex: number) => void;
  onInsertExplanationErdTemplate: (erdIndex: number, template: string) => void;
  onAddChart?: () => void;
  onChangeChart?: (chartIndex: number, value: string) => void;
  onRemoveChart?: (chartIndex: number) => void;
  onInsertChartTemplate?: (chartIndex: number, template: string) => void;
  onAddExplanationChart?: () => void;
  onChangeExplanationChart?: (chartIndex: number, value: string) => void;
  onRemoveExplanationChart?: (chartIndex: number) => void;
  onInsertExplanationChartTemplate?: (chartIndex: number, template: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onReorderChoice?: (oldIndex: number, newIndex: number) => void;
  onChangeChoice: (choiceIndex: number, value: string) => void;
  onChangeChoiceDescription?: (choiceIndex: number, value: string) => void;
  onAddChoiceFormula?: (choiceIndex: number) => void;
  onChangeChoiceFormula?: (choiceIndex: number, formulaIndex: number, value: string) => void;
  onRemoveChoiceFormula?: (choiceIndex: number, formulaIndex: number) => void;
  onInsertChoiceSymbol?: (choiceIndex: number, formulaIndex: number, symbol: string) => void;
  onAddChoiceErd?: (choiceIndex: number) => void;
  onChangeChoiceErd?: (choiceIndex: number, erdIndex: number, value: string) => void;
  onRemoveChoiceErd?: (choiceIndex: number, erdIndex: number) => void;
  onInsertChoiceErdTemplate?: (choiceIndex: number, erdIndex: number, template: string) => void;
  onAddChoiceChart?: (choiceIndex: number) => void;
  onChangeChoiceChart?: (choiceIndex: number, chartIndex: number, value: string) => void;
  onRemoveChoiceChart?: (choiceIndex: number, chartIndex: number) => void;
  onInsertChoiceChartTemplate?: (choiceIndex: number, chartIndex: number, template: string) => void;
  onChangeChoiceExplanation: (choiceIndex: number, value: string) => void;
  onChangeChoiceExplanationDescription?: (choiceIndex: number, value: string) => void;
  onAddChoiceExplanationFormula?: (choiceIndex: number) => void;
  onChangeChoiceExplanationFormula?: (
    choiceIndex: number,
    formulaIndex: number,
    value: string
  ) => void;
  onRemoveChoiceExplanationFormula?: (choiceIndex: number, formulaIndex: number) => void;
  onInsertChoiceExplanationSymbol?: (
    choiceIndex: number,
    formulaIndex: number,
    symbol: string
  ) => void;
  onAddChoiceExplanationErd?: (choiceIndex: number) => void;
  onChangeChoiceExplanationErd?: (choiceIndex: number, erdIndex: number, value: string) => void;
  onRemoveChoiceExplanationErd?: (choiceIndex: number, erdIndex: number) => void;
  onInsertChoiceExplanationErdTemplate?: (
    choiceIndex: number,
    erdIndex: number,
    template: string
  ) => void;
  onAddChoiceExplanationChart?: (choiceIndex: number) => void;
  onChangeChoiceExplanationChart?: (choiceIndex: number, chartIndex: number, value: string) => void;
  onRemoveChoiceExplanationChart?: (choiceIndex: number, chartIndex: number) => void;
  onInsertChoiceExplanationChartTemplate?: (
    choiceIndex: number,
    chartIndex: number,
    template: string
  ) => void;
  onOpenBulkDialog: () => void;
  onOpenProblemBulkDialog?: () => void;
}

export function ProblemEditorCard({
  problem,
  problemIndex,
  totalProblems,
  hashtagInput,
  onHashtagInputChange,
  onUpdateProblem,
  onDuplicateProblem,
  onRemoveProblem,
  onAddHashtag,
  onRemoveHashtag,
  onAddFormula,
  onChangeFormula,
  onRemoveFormula,
  onInsertSymbol,
  onAddExplanationFormula,
  onChangeExplanationFormula,
  onRemoveExplanationFormula,
  onInsertExplanationSymbol,
  onAddErd,
  onChangeErd,
  onRemoveErd,
  onInsertErdTemplate,
  onAddExplanationErd,
  onChangeExplanationErd,
  onRemoveExplanationErd,
  onInsertExplanationErdTemplate,
  onAddChart,
  onChangeChart,
  onRemoveChart,
  onInsertChartTemplate,
  onAddExplanationChart,
  onChangeExplanationChart,
  onRemoveExplanationChart,
  onInsertExplanationChartTemplate,
  onAddChoice,
  onRemoveChoice,
  onReorderChoice,
  onChangeChoice,
  onChangeChoiceDescription,
  onAddChoiceFormula,
  onChangeChoiceFormula,
  onRemoveChoiceFormula,
  onInsertChoiceSymbol,
  onAddChoiceErd,
  onChangeChoiceErd,
  onRemoveChoiceErd,
  onInsertChoiceErdTemplate,
  onAddChoiceChart,
  onChangeChoiceChart,
  onRemoveChoiceChart,
  onInsertChoiceChartTemplate,
  onChangeChoiceExplanation,
  onChangeChoiceExplanationDescription,
  onAddChoiceExplanationFormula,
  onChangeChoiceExplanationFormula,
  onRemoveChoiceExplanationFormula,
  onInsertChoiceExplanationSymbol,
  onAddChoiceExplanationErd,
  onChangeChoiceExplanationErd,
  onRemoveChoiceExplanationErd,
  onInsertChoiceExplanationErdTemplate,
  onAddChoiceExplanationChart,
  onChangeChoiceExplanationChart,
  onRemoveChoiceExplanationChart,
  onInsertChoiceExplanationChartTemplate,
  onOpenBulkDialog,
  onOpenProblemBulkDialog,
}: ProblemEditorCardProps) {
  const [userExpandedState, setUserExpandedState] = useState<
    Record<SectionKey, boolean | undefined>
  >({
    description: undefined,
    formulas: undefined,
    erds: undefined,
    charts: undefined,
    explanationFormulas: undefined,
    explanationErds: undefined,
    explanationCharts: undefined,
  });
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [showExpPreview, setShowExpPreview] = useState(false);

  const [openExpDescState, setOpenExpDescState] = useState<Record<number, boolean>>({});
  const [openExpFormulaState, setOpenExpFormulaState] = useState<Record<number, boolean>>({});
  const [openExpErdState, setOpenExpErdState] = useState<Record<number, boolean>>({});
  const [openExpChartState, setOpenExpChartState] = useState<Record<number, boolean>>({});

  const toggleExpDesc = (cIndex: number) => {
    setOpenExpDescState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleExpFormula = (cIndex: number) => {
    setOpenExpFormulaState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleExpErd = (cIndex: number) => {
    setOpenExpErdState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleExpChart = (cIndex: number) => {
    setOpenExpChartState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setUserExpandedState(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load expanded sections state:', e);
    }
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (hasLoadedStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userExpandedState));
      } catch (e) {
        console.error('Failed to save expanded sections state:', e);
      }
    }
  }, [userExpandedState, hasLoadedStorage]);

  const isSectionExpanded = (key: SectionKey, hasContent: boolean): boolean => {
    const manualState = userExpandedState[key];
    if (typeof manualState === 'boolean') {
      return manualState;
    }
    return hasContent;
  };

  const handleToggleSection = (key: SectionKey, hasContent: boolean) => {
    const currentExpanded = isSectionExpanded(key, hasContent);
    setUserExpandedState((prev) => ({
      ...prev,
      [key]: !currentExpanded,
    }));
  };

  const handleExpandAndAdd = (key: SectionKey, addFn: () => void) => {
    setUserExpandedState((prev) => ({
      ...prev,
      [key]: true,
    }));
    addFn();
  };

  return (
    <Card
      key={problemIndex}
      sx={{
        p: 3,
        border: (t) => `solid 1px ${t.vars.palette.divider}`,
        position: 'relative',
      }}
    >
      {/* Problem Card Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          문제 {problemIndex + 1}
          <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.disabled' }}>
            / {totalProblems}
          </Typography>
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="문제 복제">
            <IconButton size="small" tabIndex={-1} onClick={() => onDuplicateProblem(problemIndex)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="문제 삭제">
            <IconButton
              size="small"
              tabIndex={-1}
              color="error"
              disabled={totalProblems === 1}
              onClick={() => onRemoveProblem(problemIndex)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Form Fields Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Hashtags */}
        <ProblemEditorHashtags
          hashtags={problem.hashtags}
          hashtagInput={hashtagInput}
          onHashtagInputChange={onHashtagInputChange}
          onAddHashtag={onAddHashtag}
          onRemoveHashtag={onRemoveHashtag}
        />

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Question */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              문제
            </Typography>

            {onOpenProblemBulkDialog && (
              <Button
                size="small"
                tabIndex={-1}
                variant="outlined"
                color="info"
                startIcon={<FormatListNumberedIcon />}
                onClick={onOpenProblemBulkDialog}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                Bulk
              </Button>
            )}
          </Box>

          <FastTextField
            fullWidth
            multiline
            minRows={2}
            value={problem.question}
            onChange={(val) => onUpdateProblem({ question: val })}
            placeholder="문제를 입력하세요..."
          />
        </Box>

        {/* Description (Collapsible) */}
        <ProblemEditorCollapsibleSection
          title="문제 추가 설명"
          icon={<ArticleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />}
          hasContent={Boolean(problem.description && problem.description.trim().length > 0)}
          color="primary"
          expanded={isSectionExpanded(
            'description',
            Boolean(problem.description && problem.description.trim().length > 0)
          )}
          onToggle={() =>
            handleToggleSection(
              'description',
              Boolean(problem.description && problem.description.trim().length > 0)
            )
          }
        >
          <MarkdownEditor
            hideHeader
            label="문제 추가 설명"
            value={problem.description}
            onChange={(val) => onUpdateProblem({ description: val })}
            placeholder="문제에 대한 보충 설명을 입력하세요... (마크다운 지원)"
            minRows={3}
          />
        </ProblemEditorCollapsibleSection>

        {/* Formula Section (Collapsible) */}
        <ProblemEditorCollapsibleSection
          title="수식 (KaTeX)"
          icon={<FunctionsIcon color="primary" sx={{ fontSize: 20 }} />}
          count={problem.formulas?.length || 0}
          hasContent={(problem.formulas?.length || 0) > 0}
          color="primary"
          expanded={isSectionExpanded('formulas', (problem.formulas?.length || 0) > 0)}
          onToggle={() => handleToggleSection('formulas', (problem.formulas?.length || 0) > 0)}
          action={
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleExpandAndAdd('formulas', onAddFormula)}
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
            >
              수식 추가
            </Button>
          }
        >
          <ProblemEditorFormulas
            hideHeader
            title="수식 (KaTeX)"
            formulas={problem.formulas || []}
            onAddFormula={() => handleExpandAndAdd('formulas', onAddFormula)}
            onChangeFormula={onChangeFormula}
            onRemoveFormula={onRemoveFormula}
            onInsertSymbol={onInsertSymbol}
            emptyPlaceholderText="등록된 수식이 없습니다."
            labelPrefix="LaTeX 수식"
          />
        </ProblemEditorCollapsibleSection>

        {/* ERD Section (Collapsible) */}
        <ProblemEditorCollapsibleSection
          title="ERD (Entity Relationship Diagram)"
          icon={<SchemaIcon color="info" sx={{ fontSize: 20 }} />}
          count={problem.erds?.length || 0}
          hasContent={(problem.erds?.length || 0) > 0}
          color="info"
          expanded={isSectionExpanded('erds', (problem.erds?.length || 0) > 0)}
          onToggle={() => handleToggleSection('erds', (problem.erds?.length || 0) > 0)}
          action={
            <Button
              size="small"
              variant="outlined"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleExpandAndAdd('erds', onAddErd)}
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
            >
              ERD 추가
            </Button>
          }
        >
          <ProblemEditorErds
            hideHeader
            title="ERD (Entity Relationship Diagram)"
            erds={problem.erds || []}
            onAddErd={() => handleExpandAndAdd('erds', onAddErd)}
            onChangeErd={onChangeErd}
            onRemoveErd={onRemoveErd}
            onInsertTemplate={onInsertErdTemplate}
            emptyPlaceholderText="등록된 ERD가 없습니다."
            labelPrefix="ERD 다이어그램"
          />
        </ProblemEditorCollapsibleSection>

        {/* Problem Charts Section (Collapsible) */}
        {onAddChart && onChangeChart && onRemoveChart && onInsertChartTemplate && (
          <ProblemEditorCollapsibleSection
            title="문제 차트 (Plotly / Mermaid)"
            icon={<BarChartIcon color="success" sx={{ fontSize: 20 }} />}
            count={problem.charts?.length || 0}
            hasContent={(problem.charts?.length || 0) > 0}
            color="success"
            expanded={isSectionExpanded('charts', (problem.charts?.length || 0) > 0)}
            onToggle={() => handleToggleSection('charts', (problem.charts?.length || 0) > 0)}
            action={
              <Button
                size="small"
                tabIndex={-1}
                variant="outlined"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => handleExpandAndAdd('charts', onAddChart)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                차트 추가
              </Button>
            }
          >
            <ProblemEditorCharts
              hideHeader
              title="문제 차트 (Plotly / Mermaid)"
              charts={problem.charts || []}
              onAddChart={() => handleExpandAndAdd('charts', onAddChart)}
              onChangeChart={onChangeChart}
              onRemoveChart={onRemoveChart}
              onInsertTemplate={onInsertChartTemplate}
              emptyPlaceholderText="등록된 차트가 없습니다."
              labelPrefix="차트"
            />
          </ProblemEditorCollapsibleSection>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Choices */}
        <ProblemEditorChoices
          choices={problem.choices}
          choiceDescriptions={problem.choiceDescriptions}
          choiceFormulas={problem.choiceFormulas}
          choiceErds={problem.choiceErds}
          choiceCharts={problem.choiceCharts}
          answers={problem.answers}
          answer={problem.answer}
          isMultipleAnswer={problem.isMultipleAnswer}
          onAddChoice={onAddChoice}
          onRemoveChoice={onRemoveChoice}
          onReorderChoice={onReorderChoice}
          onChangeChoice={onChangeChoice}
          onChangeChoiceDescription={onChangeChoiceDescription}
          onAddChoiceFormula={onAddChoiceFormula}
          onChangeChoiceFormula={onChangeChoiceFormula}
          onRemoveChoiceFormula={onRemoveChoiceFormula}
          onInsertChoiceSymbol={onInsertChoiceSymbol}
          onAddChoiceErd={onAddChoiceErd}
          onChangeChoiceErd={onChangeChoiceErd}
          onRemoveChoiceErd={onRemoveChoiceErd}
          onInsertChoiceErdTemplate={onInsertChoiceErdTemplate}
          onAddChoiceChart={onAddChoiceChart}
          onChangeChoiceChart={onChangeChoiceChart}
          onRemoveChoiceChart={onRemoveChoiceChart}
          onInsertChoiceChartTemplate={onInsertChoiceChartTemplate}
          onOpenBulkDialog={onOpenBulkDialog}
        />

        {/* Answer Selection */}
        <ProblemEditorAnswerSelect problem={problem} onUpdateProblem={onUpdateProblem} />

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Explanation */}
        <MarkdownEditor
          label="해설"
          value={problem.explanation}
          onChange={(val) => onUpdateProblem({ explanation: val })}
          placeholder="정답에 대한 해설을 입력하세요... (마크다운 지원)"
          minRows={3}
        />

        {/* Explanation Formulas (Collapsible) */}
        <ProblemEditorCollapsibleSection
          title="해설 수식 (KaTeX)"
          icon={<FunctionsIcon color="primary" sx={{ fontSize: 20 }} />}
          count={problem.explanationFormulas?.length || 0}
          hasContent={(problem.explanationFormulas?.length || 0) > 0}
          color="primary"
          expanded={isSectionExpanded(
            'explanationFormulas',
            (problem.explanationFormulas?.length || 0) > 0
          )}
          onToggle={() =>
            handleToggleSection(
              'explanationFormulas',
              (problem.explanationFormulas?.length || 0) > 0
            )
          }
          action={
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleExpandAndAdd('explanationFormulas', onAddExplanationFormula)}
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
            >
              해설 수식 추가
            </Button>
          }
        >
          <ProblemEditorFormulas
            hideHeader
            title="해설 수식 (KaTeX)"
            formulas={problem.explanationFormulas || []}
            onAddFormula={() => handleExpandAndAdd('explanationFormulas', onAddExplanationFormula)}
            onChangeFormula={onChangeExplanationFormula}
            onRemoveFormula={onRemoveExplanationFormula}
            onInsertSymbol={onInsertExplanationSymbol}
            emptyPlaceholderText="등록된 해설 수식이 없습니다."
            labelPrefix="LaTeX 해설 수식"
          />
        </ProblemEditorCollapsibleSection>

        {/* Explanation ERD Section (Collapsible) */}
        <ProblemEditorCollapsibleSection
          title="해설 ERD (Entity Relationship Diagram)"
          icon={<SchemaIcon color="info" sx={{ fontSize: 20 }} />}
          count={problem.explanationErds?.length || 0}
          hasContent={(problem.explanationErds?.length || 0) > 0}
          color="info"
          expanded={isSectionExpanded(
            'explanationErds',
            (problem.explanationErds?.length || 0) > 0
          )}
          onToggle={() =>
            handleToggleSection('explanationErds', (problem.explanationErds?.length || 0) > 0)
          }
          action={
            <Button
              size="small"
              variant="outlined"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleExpandAndAdd('explanationErds', onAddExplanationErd)}
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
            >
              해설 ERD 추가
            </Button>
          }
        >
          <ProblemEditorErds
            hideHeader
            title="해설 ERD (Entity Relationship Diagram)"
            erds={problem.explanationErds || []}
            onAddErd={() => handleExpandAndAdd('explanationErds', onAddExplanationErd)}
            onChangeErd={onChangeErd}
            onRemoveErd={onRemoveErd}
            onInsertTemplate={onInsertExplanationErdTemplate}
            emptyPlaceholderText="등록된 해설 ERD가 없습니다."
            labelPrefix="LaTeX 해설 ERD"
          />
        </ProblemEditorCollapsibleSection>

        {/* Explanation Charts Section (Collapsible) */}
        {onAddExplanationChart &&
          onChangeExplanationChart &&
          onRemoveExplanationChart &&
          onInsertExplanationChartTemplate && (
            <ProblemEditorCollapsibleSection
              title="해설 차트 (Plotly / Mermaid)"
              icon={<BarChartIcon color="success" sx={{ fontSize: 20 }} />}
              count={problem.explanationCharts?.length || 0}
              hasContent={(problem.explanationCharts?.length || 0) > 0}
              color="success"
              expanded={isSectionExpanded(
                'explanationCharts',
                (problem.explanationCharts?.length || 0) > 0
              )}
              onToggle={() =>
                handleToggleSection(
                  'explanationCharts',
                  (problem.explanationCharts?.length || 0) > 0
                )
              }
              action={
                <Button
                  size="small"
                  tabIndex={-1}
                  variant="outlined"
                  color="success"
                  startIcon={<AddIcon />}
                  onClick={() => handleExpandAndAdd('explanationCharts', onAddExplanationChart)}
                  sx={{ borderRadius: 1.5, fontWeight: 700 }}
                >
                  해설 차트 추가
                </Button>
              }
            >
              <ProblemEditorCharts
                hideHeader
                title="해설 차트 (Plotly / Mermaid)"
                charts={problem.explanationCharts || []}
                onAddChart={() => handleExpandAndAdd('explanationCharts', onAddExplanationChart)}
                onChangeChart={onChangeExplanationChart}
                onRemoveChart={onRemoveExplanationChart}
                onInsertTemplate={onInsertExplanationChartTemplate}
                emptyPlaceholderText="등록된 해설 차트가 없습니다."
                labelPrefix="해설 차트"
              />
            </ProblemEditorCollapsibleSection>
          )}

        {/* Choice Explanations */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              객관식별 설명
            </Typography>

            <Button
              size="small"
              tabIndex={-1}
              variant="outlined"
              color={showExpPreview ? 'primary' : 'inherit'}
              startIcon={showExpPreview ? <VisibilityIcon /> : <VisibilityOffIcon />}
              onClick={() => setShowExpPreview((prev) => !prev)}
              sx={{ borderRadius: 1.5, fontWeight: 700 }}
            >
              미리보기 {showExpPreview ? 'ON' : 'OFF'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {problem.choiceExplanations.map((exp, cIndex) => {
              const choiceText = problem.choices?.[cIndex] || '';
              const expDesc = problem.choiceExplanationDescriptions?.[cIndex] || '';
              const expFormulasList = problem.choiceExplanationFormulas?.[cIndex] || [];
              const expErdsList = problem.choiceExplanationErds?.[cIndex] || [];
              const expChartsList = problem.choiceExplanationCharts?.[cIndex] || [];

              const hasExpDesc = Boolean(expDesc && expDesc.trim().length > 0);
              const hasExpFormulas = expFormulasList.length > 0;
              const hasExpErds = expErdsList.length > 0;
              const hasExpCharts = expChartsList.length > 0;

              const isExpDescOpen = openExpDescState[cIndex] ?? hasExpDesc;
              const isExpFormulaOpen = openExpFormulaState[cIndex] ?? hasExpFormulas;
              const isExpErdOpen = openExpErdState[cIndex] ?? hasExpErds;
              const isExpChartOpen = openExpChartState[cIndex] ?? hasExpCharts;

              return (
                <Box
                  key={cIndex}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.16)}`,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.02),
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cIndex + 1}번: {choiceText || '(내용 없음)'}
                    </Typography>

                    {/* Section Toggle Buttons for Choice Explanation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={`${cIndex + 1}번 설명 추가 설명`}>
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          color={isExpDescOpen || hasExpDesc ? 'primary' : 'default'}
                          onClick={() => toggleExpDesc(cIndex)}
                          sx={{
                            bgcolor:
                              isExpDescOpen || hasExpDesc
                                ? (t) => alpha(t.palette.primary.main, 0.08)
                                : 'transparent',
                          }}
                        >
                          <ArticleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={`${cIndex + 1}번 설명 추가 수식`}>
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          color={isExpFormulaOpen || hasExpFormulas ? 'primary' : 'default'}
                          onClick={() => toggleExpFormula(cIndex)}
                          sx={{
                            bgcolor:
                              isExpFormulaOpen || hasExpFormulas
                                ? (t) => alpha(t.palette.primary.main, 0.08)
                                : 'transparent',
                          }}
                        >
                          <FunctionsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={`${cIndex + 1}번 설명 추가 ERD`}>
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          color={isExpErdOpen || hasExpErds ? 'info' : 'default'}
                          onClick={() => toggleExpErd(cIndex)}
                          sx={{
                            bgcolor:
                              isExpErdOpen || hasExpErds
                                ? (t) => alpha(t.palette.info.main, 0.08)
                                : 'transparent',
                          }}
                        >
                          <SchemaIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={`${cIndex + 1}번 설명 추가 차트`}>
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          color={isExpChartOpen || hasExpCharts ? 'success' : 'default'}
                          onClick={() => toggleExpChart(cIndex)}
                          sx={{
                            bgcolor:
                              isExpChartOpen || hasExpCharts
                                ? (t) => alpha(t.palette.success.main, 0.08)
                                : 'transparent',
                          }}
                        >
                          <BarChartIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <FastTextField
                    fullWidth
                    size="small"
                    label={`${cIndex + 1}번 설명`}
                    value={exp}
                    onChange={(val) => onChangeChoiceExplanation(cIndex, val)}
                    placeholder={`${cIndex + 1}번 선택지에 대한 설명`}
                  />

                  {/* Dedicated Sub-Section: N번 설명 추가 설명 */}
                  {(isExpDescOpen || hasExpDesc) && onChangeChoiceExplanationDescription && (
                    <ProblemEditorCollapsibleSection
                      title={`${cIndex + 1}번 설명 추가 설명`}
                      icon={<ArticleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                      hasContent={hasExpDesc}
                      color="primary"
                      expanded={isExpDescOpen}
                      onToggle={() => toggleExpDesc(cIndex)}
                    >
                      <MarkdownEditor
                        hideHeader
                        label={`${cIndex + 1}번 설명 추가 설명`}
                        value={expDesc}
                        onChange={(val) => onChangeChoiceExplanationDescription(cIndex, val)}
                        placeholder={`${cIndex + 1}번 선택지 설명에 대한 보충 설명을 입력하세요... (마크다운 지원)`}
                        minRows={2}
                      />
                    </ProblemEditorCollapsibleSection>
                  )}

                  {/* Dedicated Sub-Section: N번 설명 추가 수식 */}
                  {(isExpFormulaOpen || hasExpFormulas) &&
                    onAddChoiceExplanationFormula &&
                    onChangeChoiceExplanationFormula &&
                    onRemoveChoiceExplanationFormula &&
                    onInsertChoiceExplanationSymbol && (
                      <ProblemEditorCollapsibleSection
                        title={`${cIndex + 1}번 설명 추가 수식`}
                        icon={<FunctionsIcon color="primary" sx={{ fontSize: 18 }} />}
                        count={expFormulasList.length}
                        hasContent={hasExpFormulas}
                        color="primary"
                        expanded={isExpFormulaOpen}
                        onToggle={() => toggleExpFormula(cIndex)}
                        action={
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => onAddChoiceExplanationFormula(cIndex)}
                            sx={{ borderRadius: 1.5, fontWeight: 700 }}
                          >
                            해설 수식 추가
                          </Button>
                        }
                      >
                        <ProblemEditorFormulas
                          hideHeader
                          title={`${cIndex + 1}번 설명 추가 수식`}
                          formulas={expFormulasList}
                          onAddFormula={() => onAddChoiceExplanationFormula(cIndex)}
                          onChangeFormula={(fIdx, val) =>
                            onChangeChoiceExplanationFormula(cIndex, fIdx, val)
                          }
                          onRemoveFormula={(fIdx) => onRemoveChoiceExplanationFormula(cIndex, fIdx)}
                          onInsertSymbol={(fIdx, sym) =>
                            onInsertChoiceExplanationSymbol(cIndex, fIdx, sym)
                          }
                          emptyPlaceholderText={`${cIndex + 1}번 설명에 등록된 수식이 없습니다.`}
                          labelPrefix={`${cIndex + 1}번 설명 수식`}
                        />
                      </ProblemEditorCollapsibleSection>
                    )}

                  {/* Dedicated Sub-Section: N번 설명 추가 ERD */}
                  {(isExpErdOpen || hasExpErds) &&
                    onAddChoiceExplanationErd &&
                    onChangeChoiceExplanationErd &&
                    onRemoveChoiceExplanationErd &&
                    onInsertChoiceExplanationErdTemplate && (
                      <ProblemEditorCollapsibleSection
                        title={`${cIndex + 1}번 설명 추가 ERD`}
                        icon={<SchemaIcon color="info" sx={{ fontSize: 18 }} />}
                        count={expErdsList.length}
                        hasContent={hasExpErds}
                        color="info"
                        expanded={isExpErdOpen}
                        onToggle={() => toggleExpErd(cIndex)}
                        action={
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            startIcon={<AddIcon />}
                            onClick={() => onAddChoiceExplanationErd(cIndex)}
                            sx={{ borderRadius: 1.5, fontWeight: 700 }}
                          >
                            해설 ERD 추가
                          </Button>
                        }
                      >
                        <ProblemEditorErds
                          hideHeader
                          title={`${cIndex + 1}번 설명 추가 ERD`}
                          erds={expErdsList}
                          onAddErd={() => onAddChoiceExplanationErd(cIndex)}
                          onChangeErd={(erdIdx, val) =>
                            onChangeChoiceExplanationErd(cIndex, erdIdx, val)
                          }
                          onRemoveErd={(erdIdx) => onRemoveChoiceExplanationErd(cIndex, erdIdx)}
                          onInsertTemplate={(erdIdx, tmpl) =>
                            onInsertChoiceExplanationErdTemplate(cIndex, erdIdx, tmpl)
                          }
                          emptyPlaceholderText={`${cIndex + 1}번 설명에 등록된 ERD가 없습니다.`}
                          labelPrefix={`${cIndex + 1}번 설명 ERD`}
                        />
                      </ProblemEditorCollapsibleSection>
                    )}

                  {/* Dedicated Sub-Section: N번 설명 추가 차트 */}
                  {(isExpChartOpen || hasExpCharts) &&
                    onAddChoiceExplanationChart &&
                    onChangeChoiceExplanationChart &&
                    onRemoveChoiceExplanationChart &&
                    onInsertChoiceExplanationChartTemplate && (
                      <ProblemEditorCollapsibleSection
                        title={`${cIndex + 1}번 설명 추가 차트`}
                        icon={<BarChartIcon color="success" sx={{ fontSize: 18 }} />}
                        count={expChartsList.length}
                        hasContent={hasExpCharts}
                        color="success"
                        expanded={isExpChartOpen}
                        onToggle={() => toggleExpChart(cIndex)}
                        action={
                          <Button
                            size="small"
                            tabIndex={-1}
                            variant="outlined"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => onAddChoiceExplanationChart(cIndex)}
                            sx={{ borderRadius: 1.5, fontWeight: 700 }}
                          >
                            해설 차트 추가
                          </Button>
                        }
                      >
                        <ProblemEditorCharts
                          hideHeader
                          title={`${cIndex + 1}번 설명 추가 차트`}
                          charts={expChartsList}
                          onAddChart={() => onAddChoiceExplanationChart(cIndex)}
                          onChangeChart={(chartIdx, val) =>
                            onChangeChoiceExplanationChart(cIndex, chartIdx, val)
                          }
                          onRemoveChart={(chartIdx) =>
                            onRemoveChoiceExplanationChart(cIndex, chartIdx)
                          }
                          onInsertTemplate={(chartIdx, tmpl) =>
                            onInsertChoiceExplanationChartTemplate(cIndex, chartIdx, tmpl)
                          }
                          emptyPlaceholderText={`${cIndex + 1}번 설명에 등록된 차트가 없습니다.`}
                          labelPrefix={`${cIndex + 1}번 설명 차트`}
                        />
                      </ProblemEditorCollapsibleSection>
                    )}

                  {/* Live Preview Box for Choice Explanation (Toggled via showExpPreview, default OFF) */}
                  {showExpPreview && exp && exp.trim().length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                        border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.2)}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', fontWeight: 700, mb: 0.5, display: 'block' }}
                      >
                        {cIndex + 1}번 설명 미리보기:
                      </Typography>
                      <RichContentRenderer content={exp} idPrefix={`exp_edit_${cIndex}`} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
