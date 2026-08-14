import type { Problem } from './types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import FunctionsIcon from '@mui/icons-material/Functions';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';

import Button from '@mui/material/Button';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import { MarkdownEditor } from 'src/components/markdown-editor';

import { FastTextField } from './fast-text-field';
import { ProblemEditorChoices } from './problem-editor-choices';
import { ProblemEditorHashtags } from './problem-editor-hashtags';
import { ProblemEditorFormulas } from './problem-editor-formulas';
import { ProblemEditorErds } from './problem-editor-erds';
import { ProblemEditorAnswerSelect } from './problem-editor-answer-select';
import { ProblemEditorCollapsibleSection } from './problem-editor-collapsible-section';

type SectionKey = 'description' | 'formulas' | 'erds' | 'explanationFormulas' | 'explanationErds';

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
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onChangeChoice: (choiceIndex: number, value: string) => void;
  onChangeChoiceExplanation: (choiceIndex: number, value: string) => void;
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
  onAddChoice,
  onRemoveChoice,
  onChangeChoice,
  onChangeChoiceExplanation,
  onOpenBulkDialog,
  onOpenProblemBulkDialog,
}: ProblemEditorCardProps) {
  const [userExpandedState, setUserExpandedState] = useState<
    Record<SectionKey, boolean | undefined>
  >({
    description: undefined,
    formulas: undefined,
    erds: undefined,
    explanationFormulas: undefined,
    explanationErds: undefined,
  });
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

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
            <IconButton size="small" onClick={() => onDuplicateProblem(problemIndex)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="문제 삭제">
            <IconButton
              size="small"
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

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Choices */}
        <ProblemEditorChoices
          choices={problem.choices}
          answers={problem.answers}
          answer={problem.answer}
          isMultipleAnswer={problem.isMultipleAnswer}
          onAddChoice={onAddChoice}
          onRemoveChoice={onRemoveChoice}
          onChangeChoice={onChangeChoice}
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

        {/* Choice Explanations */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>
            객관식별 설명
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {problem.choiceExplanations.map((exp, cIndex) => {
              const choiceText = problem.choices?.[cIndex] || '';
              return (
                <Box key={cIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      px: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cIndex + 1}번: {choiceText || '(내용 없음)'}
                  </Typography>
                  <FastTextField
                    fullWidth
                    size="small"
                    label={`${cIndex + 1}번 설명`}
                    value={exp}
                    onChange={(val) => onChangeChoiceExplanation(cIndex, val)}
                    placeholder={`${cIndex + 1}번 선택지에 대한 설명`}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
