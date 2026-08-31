'use client';

import type { ConceptLink } from './types';

import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';

import { getAllStudyConcepts, type StudyConceptSummary } from 'src/api/indexDB';

import { StudyConceptModal } from 'src/sections/study/components/study-concept-modal';

// ----------------------------------------------------------------------

interface ProblemEditorConceptLinksProps {
  conceptLinks?: ConceptLink[];
  onAddConceptLink: (link: ConceptLink) => void;
  onRemoveConceptLink: (index: number) => void;
}

export const ProblemEditorConceptLinks = memo(function ProblemEditorConceptLinks({
  conceptLinks = [],
  onAddConceptLink,
  onRemoveConceptLink,
}: ProblemEditorConceptLinksProps) {
  const [availableConcepts, setAvailableConcepts] = useState<StudyConceptSummary[]>([]);
  const [selectedPreviewConceptId, setSelectedPreviewConceptId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const loadConcepts = useCallback(async () => {
    try {
      const list = await getAllStudyConcepts();
      setAvailableConcepts(list);
    } catch (err) {
      console.error('Failed to load study concepts', err);
    }
  }, []);

  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  const handleSelectConcept = (_event: any, value: StudyConceptSummary | null) => {
    if (!value) return;

    // Check if already linked
    if (conceptLinks.some((l) => l.id === value.conceptId)) {
      return;
    }

    onAddConceptLink({
      id: value.conceptId,
      title: value.title,
      fileId: value.fileId,
      fileName: value.fileName,
    });
  };

  const handleOpenPreview = (conceptId: string) => {
    setSelectedPreviewConceptId(conceptId);
    setPreviewModalOpen(true);
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookRoundedIcon color="primary" sx={{ fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            관련 개념 링크 (Study)
          </Typography>
          {conceptLinks.length > 0 && (
            <Chip
              label={`${conceptLinks.length}개`}
              size="small"
              color="primary"
              variant="soft"
              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
            />
          )}
        </Box>

        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={loadConcepts}
          sx={{ fontSize: 12, fontWeight: 700 }}
        >
          새로고침
        </Button>
      </Box>

      {/* Autocomplete Search Input */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          size="small"
          options={availableConcepts}
          getOptionLabel={(option) =>
            `${option.title} (${option.fileName})${option.hashtags.length ? ` [${option.hashtags.join(', ')}]` : ''}`
          }
          onChange={handleSelectConcept}
          value={null}
          noOptionsText="등록된 Study 개념이 없습니다. Study 메뉴에서 개념을 먼저 작성하세요."
          renderInput={(params) => (
            <TextField
              {...params}
              label="Study 개념 검색 및 연결 (제목 또는 해시태그로 검색)"
              placeholder="연결할 개념을 선택하세요..."
            />
          )}
        />
      </Box>

      {/* Linked Concept Chips / Cards */}
      {conceptLinks.length === 0 ? (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            borderRadius: 1.5,
            border: (t) => `2px dashed ${alpha(t.palette.primary.main, 0.2)}`,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            연결된 Study 개념이 없습니다.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
            문제를 풀고 난 후 정답 및 해설에서 바로 확인할 수 있도록 관련 Study 개념을 연결해
            보세요.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {conceptLinks.map((link, lIndex) => (
            <Chip
              key={link.id || lIndex}
              icon={<MenuBookRoundedIcon fontSize="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                    {link.title}
                  </Typography>
                  {link.fileName && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontSize: 11, opacity: 0.8 }}
                    >
                      ({link.fileName})
                    </Typography>
                  )}
                </Box>
              }
              onDelete={() => onRemoveConceptLink(lIndex)}
              onClick={() => handleOpenPreview(link.id)}
              color="primary"
              variant="outlined"
              sx={{
                py: 2.2,
                px: 1,
                borderRadius: 1.5,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                borderColor: (t) => alpha(t.palette.primary.main, 0.3),
                '&:hover': {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Concept Preview Modal */}
      <StudyConceptModal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedPreviewConceptId(null);
        }}
        conceptId={selectedPreviewConceptId}
      />
    </Box>
  );
});
