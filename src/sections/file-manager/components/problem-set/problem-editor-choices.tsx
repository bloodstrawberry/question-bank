import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import SchemaIcon from '@mui/icons-material/Schema';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { MarkdownEditor } from 'src/components/markdown-editor';

import { FastTextField } from './fast-text-field';
import { ProblemEditorErds } from './problem-editor-erds';
import { ProblemEditorCharts } from './problem-editor-charts';
import { RichContentRenderer } from './rich-content-renderer';
import { ProblemEditorFormulas } from './problem-editor-formulas';
import { ProblemEditorCollapsibleSection } from './problem-editor-collapsible-section';

// ----------------------------------------------------------------------

let choiceIdCounter = 0;
const generateChoiceId = () => {
  choiceIdCounter += 1;
  return `choice-id-${Date.now()}-${choiceIdCounter}-${Math.random().toString(36).substring(2, 7)}`;
};

interface ProblemEditorChoicesProps {
  choices: string[];
  choiceDescriptions?: string[];
  choiceFormulas?: string[][];
  choiceErds?: string[][];
  choiceCharts?: string[][];
  answers?: number[];
  answer: number;
  isMultipleAnswer?: boolean;
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
  onOpenBulkDialog: () => void;
}

interface SortableChoiceItemProps {
  id: string;
  cIndex: number;
  choice: string;
  isThisChoiceCorrect: boolean;
  choicesCount: number;
  description: string;
  formulasList: string[];
  erdsList: string[];
  chartsList: string[];
  hasDesc: boolean;
  hasFormulas: boolean;
  hasErds: boolean;
  hasCharts: boolean;
  isDescOpen: boolean;
  isFormulaOpen: boolean;
  isErdOpen: boolean;
  isChartOpen: boolean;
  showPreview: boolean;
  onChangeChoice: (choiceIndex: number, value: string) => void;
  onRemoveChoice: (choiceIndex: number) => void;
  toggleDesc: (cIndex: number) => void;
  toggleFormula: (cIndex: number) => void;
  toggleErd: (cIndex: number) => void;
  toggleChart: (cIndex: number) => void;
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
}

function SortableChoiceItem({
  id,
  cIndex,
  choice,
  isThisChoiceCorrect,
  choicesCount,
  description,
  formulasList,
  erdsList,
  chartsList,
  hasDesc,
  hasFormulas,
  hasErds,
  hasCharts,
  isDescOpen,
  isFormulaOpen,
  isErdOpen,
  isChartOpen,
  showPreview,
  onChangeChoice,
  onRemoveChoice,
  toggleDesc,
  toggleFormula,
  toggleErd,
  toggleChart,
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
}: SortableChoiceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1100 : 'auto',
    opacity: isDragging ? 0.6 : 1,
    position: 'relative' as const,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1.5,
        border: (t) => `1px solid ${alpha(t.palette.grey[500], isDragging ? 0.4 : 0.16)}`,
        bgcolor: (t) => alpha(t.palette.grey[500], isDragging ? 0.08 : 0.02),
        boxShadow: isDragging ? (t) => t.customShadows?.z8 : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton
          size="small"
          sx={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: 'text.secondary',
            p: 0.5,
            touchAction: 'none',
            '&:hover': { bgcolor: 'action.hover' },
          }}
          {...attributes}
          {...listeners}
          tabIndex={-1}
          aria-label={`${cIndex + 1}번 선택지 순서 변경`}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <FastTextField
          fullWidth
          size="small"
          label={`${cIndex + 1}번`}
          value={choice}
          onChange={(val) => onChangeChoice(cIndex, val)}
          placeholder={`${cIndex + 1}번 선택지를 입력하세요`}
          sx={{
            '& .MuiOutlinedInput-root': {
              ...(isThisChoiceCorrect && {
                bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                '& fieldset': {
                  borderColor: 'success.main',
                  borderWidth: 2,
                },
              }),
            },
          }}
        />

        {/* Markdown, Formula, ERD Section Toggle Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={`${cIndex + 1}번 객관식 추가 설명`}>
            <IconButton
              size="small"
              tabIndex={-1}
              color={isDescOpen || hasDesc ? 'primary' : 'default'}
              onClick={() => toggleDesc(cIndex)}
              sx={{
                bgcolor:
                  isDescOpen || hasDesc
                    ? (t) => alpha(t.palette.primary.main, 0.08)
                    : 'transparent',
              }}
            >
              <ArticleIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`${cIndex + 1}번 객관식 추가 수식`}>
            <IconButton
              size="small"
              tabIndex={-1}
              color={isFormulaOpen || hasFormulas ? 'primary' : 'default'}
              onClick={() => toggleFormula(cIndex)}
              sx={{
                bgcolor:
                  isFormulaOpen || hasFormulas
                    ? (t) => alpha(t.palette.primary.main, 0.08)
                    : 'transparent',
              }}
            >
              <FunctionsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`${cIndex + 1}번 객관식 추가 ERD`}>
            <IconButton
              size="small"
              tabIndex={-1}
              color={isErdOpen || hasErds ? 'info' : 'default'}
              onClick={() => toggleErd(cIndex)}
              sx={{
                bgcolor:
                  isErdOpen || hasErds ? (t) => alpha(t.palette.info.main, 0.08) : 'transparent',
              }}
            >
              <SchemaIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`${cIndex + 1}번 객관식 추가 차트`}>
            <IconButton
              size="small"
              tabIndex={-1}
              color={isChartOpen || hasCharts ? 'success' : 'default'}
              onClick={() => toggleChart(cIndex)}
              sx={{
                bgcolor:
                  isChartOpen || hasCharts
                    ? (t) => alpha(t.palette.success.main, 0.08)
                    : 'transparent',
              }}
            >
              <BarChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <IconButton
          size="small"
          tabIndex={-1}
          color="error"
          disabled={choicesCount <= 2}
          onClick={() => onRemoveChoice(cIndex)}
          title="선택지 삭제"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Dedicated Sub-Section: N번 객관식 추가 설명 */}
      {(isDescOpen || hasDesc) && onChangeChoiceDescription && (
        <ProblemEditorCollapsibleSection
          title={`${cIndex + 1}번 객관식 추가 설명`}
          icon={<ArticleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
          hasContent={hasDesc}
          color="primary"
          expanded={isDescOpen}
          onToggle={() => toggleDesc(cIndex)}
        >
          <MarkdownEditor
            hideHeader
            label={`${cIndex + 1}번 추가 설명`}
            value={description}
            onChange={(val) => onChangeChoiceDescription(cIndex, val)}
            placeholder={`${cIndex + 1}번 선택지에 대한 추가 설명을 입력하세요... (마크다운 지원)`}
            minRows={2}
          />
        </ProblemEditorCollapsibleSection>
      )}

      {/* Dedicated Sub-Section: N번 객관식 추가 수식 */}
      {(isFormulaOpen || hasFormulas) &&
        onAddChoiceFormula &&
        onChangeChoiceFormula &&
        onRemoveChoiceFormula &&
        onInsertChoiceSymbol && (
          <ProblemEditorCollapsibleSection
            title={`${cIndex + 1}번 객관식 추가 수식`}
            icon={<FunctionsIcon color="primary" sx={{ fontSize: 18 }} />}
            count={formulasList.length}
            hasContent={hasFormulas}
            color="primary"
            expanded={isFormulaOpen}
            onToggle={() => toggleFormula(cIndex)}
            action={
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => onAddChoiceFormula(cIndex)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                수식 추가
              </Button>
            }
          >
            <ProblemEditorFormulas
              hideHeader
              title={`${cIndex + 1}번 객관식 추가 수식`}
              formulas={formulasList}
              onAddFormula={() => onAddChoiceFormula(cIndex)}
              onChangeFormula={(fIdx, val) => onChangeChoiceFormula(cIndex, fIdx, val)}
              onRemoveFormula={(fIdx) => onRemoveChoiceFormula(cIndex, fIdx)}
              onInsertSymbol={(fIdx, sym) => onInsertChoiceSymbol(cIndex, fIdx, sym)}
              emptyPlaceholderText={`${cIndex + 1}번 선택지에 등록된 수식이 없습니다.`}
              labelPrefix={`${cIndex + 1}번 선택지 수식`}
            />
          </ProblemEditorCollapsibleSection>
        )}

      {/* Dedicated Sub-Section: N번 객관식 추가 ERD */}
      {(isErdOpen || hasErds) &&
        onAddChoiceErd &&
        onChangeChoiceErd &&
        onRemoveChoiceErd &&
        onInsertChoiceErdTemplate && (
          <ProblemEditorCollapsibleSection
            title={`${cIndex + 1}번 객관식 추가 ERD`}
            icon={<SchemaIcon color="info" sx={{ fontSize: 18 }} />}
            count={erdsList.length}
            hasContent={hasErds}
            color="info"
            expanded={isErdOpen}
            onToggle={() => toggleErd(cIndex)}
            action={
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<AddIcon />}
                onClick={() => onAddChoiceErd(cIndex)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                ERD 추가
              </Button>
            }
          >
            <ProblemEditorErds
              hideHeader
              title={`${cIndex + 1}번 객관식 추가 ERD`}
              erds={erdsList}
              onAddErd={() => onAddChoiceErd(cIndex)}
              onChangeErd={(erdIdx, val) => onChangeChoiceErd(cIndex, erdIdx, val)}
              onRemoveErd={(erdIdx) => onRemoveChoiceErd(cIndex, erdIdx)}
              onInsertTemplate={(erdIdx, tmpl) => onInsertChoiceErdTemplate(cIndex, erdIdx, tmpl)}
              emptyPlaceholderText={`${cIndex + 1}번 선택지에 등록된 ERD가 없습니다.`}
              labelPrefix={`${cIndex + 1}번 선택지 ERD`}
            />
          </ProblemEditorCollapsibleSection>
        )}

      {/* Dedicated Sub-Section: N번 객관식 추가 차트 */}
      {(isChartOpen || hasCharts) &&
        onAddChoiceChart &&
        onChangeChoiceChart &&
        onRemoveChoiceChart &&
        onInsertChoiceChartTemplate && (
          <ProblemEditorCollapsibleSection
            title={`${cIndex + 1}번 객관식 추가 차트`}
            icon={<BarChartIcon color="success" sx={{ fontSize: 18 }} />}
            count={chartsList.length}
            hasContent={hasCharts}
            color="success"
            expanded={isChartOpen}
            onToggle={() => toggleChart(cIndex)}
            action={
              <Button
                size="small"
                tabIndex={-1}
                variant="outlined"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => onAddChoiceChart(cIndex)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                차트 추가
              </Button>
            }
          >
            <ProblemEditorCharts
              hideHeader
              title={`${cIndex + 1}번 객관식 추가 차트`}
              charts={chartsList}
              onAddChart={() => onAddChoiceChart(cIndex)}
              onChangeChart={(chartIdx, val) => onChangeChoiceChart(cIndex, chartIdx, val)}
              onRemoveChart={(chartIdx) => onRemoveChoiceChart(cIndex, chartIdx)}
              onInsertTemplate={(chartIdx, tmpl) =>
                onInsertChoiceChartTemplate(cIndex, chartIdx, tmpl)
              }
              emptyPlaceholderText={`${cIndex + 1}번 선택지에 등록된 차트가 없습니다.`}
              labelPrefix={`${cIndex + 1}번 선택지 차트`}
            />
          </ProblemEditorCollapsibleSection>
        )}

      {/* Optional Live Preview Box (Toggled via showPreview, default OFF) */}
      {showPreview && choice && choice.trim().length > 0 && (
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
            {cIndex + 1}번 선택지 미리보기:
          </Typography>
          <RichContentRenderer content={choice} idPrefix={`choice_edit_${cIndex}`} inline />
        </Box>
      )}
    </Box>
  );
}

export function ProblemEditorChoices({
  choices = [],
  choiceDescriptions = [],
  choiceFormulas = [],
  choiceErds = [],
  choiceCharts = [],
  answers = [],
  answer = 0,
  isMultipleAnswer = false,
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
  onOpenBulkDialog,
}: ProblemEditorChoicesProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [openDescState, setOpenDescState] = useState<Record<number, boolean>>({});
  const [openFormulaState, setOpenFormulaState] = useState<Record<number, boolean>>({});
  const [openErdState, setOpenErdState] = useState<Record<number, boolean>>({});
  const [openChartState, setOpenChartState] = useState<Record<number, boolean>>({});

  const [choiceIds, setChoiceIds] = useState<string[]>(() => choices.map(() => generateChoiceId()));

  useEffect(() => {
    setChoiceIds((prevIds) => {
      if (prevIds.length === choices.length) return prevIds;
      if (prevIds.length < choices.length) {
        const added = Array.from({ length: choices.length - prevIds.length }, () =>
          generateChoiceId()
        );
        return [...prevIds, ...added];
      }
      return prevIds.slice(0, choices.length);
    });
  }, [choices.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = choiceIds.indexOf(String(active.id));
      const newIndex = choiceIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        setChoiceIds((prevIds) => arrayMove(prevIds, oldIndex, newIndex));
        onReorderChoice?.(oldIndex, newIndex);
      }
    }
  };

  const toggleDesc = (cIndex: number) => {
    setOpenDescState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleFormula = (cIndex: number) => {
    setOpenFormulaState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleErd = (cIndex: number) => {
    setOpenErdState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  const toggleChart = (cIndex: number) => {
    setOpenChartState((prev) => ({ ...prev, [cIndex]: !prev[cIndex] }));
  };

  return (
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
          객관식 선택지 ({choices.length}개)
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color={showPreview ? 'primary' : 'inherit'}
            startIcon={showPreview ? <VisibilityIcon /> : <VisibilityOffIcon />}
            onClick={() => setShowPreview((prev) => !prev)}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            미리보기 {showPreview ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color="info"
            startIcon={<FormatListNumberedIcon />}
            onClick={onOpenBulkDialog}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            Bulk
          </Button>

          <Button
            size="small"
            tabIndex={-1}
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddChoice}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            선택지 추가
          </Button>
        </Box>
      </Box>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={choiceIds} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {choices.map((choice, cIndex) => {
              const itemId = choiceIds[cIndex] || `fallback-${cIndex}`;
              const isThisChoiceCorrect = isMultipleAnswer
                ? answers.includes(cIndex + 1)
                : answer === cIndex + 1;

              const description = choiceDescriptions[cIndex] || '';
              const formulasList = choiceFormulas[cIndex] || [];
              const erdsList = choiceErds[cIndex] || [];
              const chartsList = choiceCharts[cIndex] || [];

              const hasDesc = Boolean(description && description.trim().length > 0);
              const hasFormulas = formulasList.length > 0;
              const hasErds = erdsList.length > 0;
              const hasCharts = chartsList.length > 0;

              const isDescOpen = openDescState[cIndex] ?? hasDesc;
              const isFormulaOpen = openFormulaState[cIndex] ?? hasFormulas;
              const isErdOpen = openErdState[cIndex] ?? hasErds;
              const isChartOpen = openChartState[cIndex] ?? hasCharts;

              return (
                <SortableChoiceItem
                  key={itemId}
                  id={itemId}
                  cIndex={cIndex}
                  choice={choice}
                  isThisChoiceCorrect={isThisChoiceCorrect}
                  choicesCount={choices.length}
                  description={description}
                  formulasList={formulasList}
                  erdsList={erdsList}
                  chartsList={chartsList}
                  hasDesc={hasDesc}
                  hasFormulas={hasFormulas}
                  hasErds={hasErds}
                  hasCharts={hasCharts}
                  isDescOpen={isDescOpen}
                  isFormulaOpen={isFormulaOpen}
                  isErdOpen={isErdOpen}
                  isChartOpen={isChartOpen}
                  showPreview={showPreview}
                  onChangeChoice={onChangeChoice}
                  onRemoveChoice={onRemoveChoice}
                  toggleDesc={toggleDesc}
                  toggleFormula={toggleFormula}
                  toggleErd={toggleErd}
                  toggleChart={toggleChart}
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
                />
              );
            })}
          </Box>
        </SortableContext>
      </DndContext>
    </Box>
  );
}
