'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import type { StudyConcept } from '../types';

import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import {
  useSensor,
  DndContext,
  useSensors,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ReorderIcon from '@mui/icons-material/Reorder';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// ----------------------------------------------------------------------

interface ConceptItemWrap {
  tempId: string;
  concept: StudyConcept;
  originalIndex: number;
}

interface StudyConceptReorderDialogProps {
  open: boolean;
  onClose: () => void;
  concepts: StudyConcept[];
  activeConceptIndex: number;
  onApplyReorder: (newConcepts: StudyConcept[], newActiveIndex: number) => void;
}

interface SortableConceptItemProps {
  id: string;
  index: number;
  concept: StudyConcept;
  isActive: boolean;
}

function SortableConceptItem({ id, index, concept, isActive }: SortableConceptItemProps) {
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

  const titleSnippet = concept.title ? concept.title.trim() : '';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 1.5,
        bgcolor: (t) =>
          isDragging
            ? alpha(t.palette.primary.main, 0.08)
            : isActive
              ? alpha(t.palette.primary.main, 0.04)
              : alpha(t.palette.grey[500], 0.02),
        borderColor: (t) =>
          isDragging
            ? t.palette.primary.main
            : isActive
              ? alpha(t.palette.primary.main, 0.4)
              : alpha(t.palette.grey[500], 0.2),
        boxShadow: isDragging ? (t) => t.customShadows?.z8 : 'none',
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
        aria-label={`${index + 1}번 개념 순서 변경`}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: isActive ? 'primary.main' : 'text.primary',
          minWidth: 65,
          flexShrink: 0,
        }}
      >
        {index + 1}번 개념
      </Typography>

      {titleSnippet ? (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexGrow: 1,
          }}
        >
          {titleSnippet}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={{ color: 'text.disabled', fontStyle: 'italic', flexGrow: 1 }}
        >
          (제목 없음)
        </Typography>
      )}
    </Card>
  );
}

export function StudyConceptReorderDialog({
  open,
  onClose,
  concepts = [],
  activeConceptIndex,
  onApplyReorder,
}: StudyConceptReorderDialogProps) {
  const [items, setItems] = useState<ConceptItemWrap[]>([]);

  useEffect(() => {
    if (open) {
      setItems(
        concepts.map((c, idx) => ({
          tempId: `concept-reorder-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          concept: c,
          originalIndex: idx,
        }))
      );
    }
  }, [open, concepts]);

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

  const itemIds = items.map((it) => it.tempId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  const handleApply = () => {
    const newConcepts = items.map((it) => it.concept);
    const activeItem = items.find((it) => it.originalIndex === activeConceptIndex);
    const newActiveIndex = activeItem ? items.indexOf(activeItem) : 0;

    onApplyReorder(newConcepts, Math.max(0, newActiveIndex));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          p: 3,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          mb: 1,
          fontWeight: 800,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ReorderIcon color="primary" />
        개념 순서 변경 ({concepts.length}개)
      </DialogTitle>

      <DialogContent sx={{ p: 0, py: 1, overflowY: 'auto' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          개념 카드를 드래그 앤 드롭하여 순서를 변경할 수 있습니다.
        </Typography>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {items.map((item, index) => (
                <SortableConceptItem
                  key={item.tempId}
                  id={item.tempId}
                  index={index}
                  concept={item.concept}
                  isActive={item.originalIndex === activeConceptIndex}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} tabIndex={-1}>
          취소
        </Button>
        <Button variant="contained" color="primary" onClick={handleApply} sx={{ fontWeight: 700 }}>
          적용하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
