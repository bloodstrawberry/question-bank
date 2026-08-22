'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';

import { getStudyConceptById } from 'src/api/indexDB';
import { paths } from 'src/routes/paths';

import { StudyConceptViewCard } from './study-concept-view-card';
import type { StudyConcept } from '../types';

// ----------------------------------------------------------------------

interface StudyConceptModalProps {
  open: boolean;
  onClose: () => void;
  conceptId?: string | null;
  concept?: StudyConcept | null;
  fileId?: string;
  fileName?: string;
}

export function StudyConceptModal({
  open,
  onClose,
  conceptId,
  concept: initialConcept,
  fileId: initialFileId,
  fileName: initialFileName,
}: StudyConceptModalProps) {
  const router = useRouter();
  const [loadedData, setLoadedData] = useState<{
    fileId: string;
    fileName: string;
    concept: StudyConcept;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (initialConcept) {
      setLoadedData({
        fileId: initialFileId || '',
        fileName: initialFileName || '',
        concept: initialConcept,
      });
      return;
    }

    if (conceptId) {
      setLoading(true);
      getStudyConceptById(conceptId)
        .then((res) => {
          if (res) {
            setLoadedData({
              fileId: res.fileId,
              fileName: res.fileName,
              concept: res.concept,
            });
          } else {
            setLoadedData(null);
          }
        })
        .catch((err) => {
          console.error('Failed to load study concept by id', err);
          setLoadedData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, conceptId, initialConcept, initialFileId, initialFileName]);

  const concept = initialConcept || loadedData?.concept;
  const fileId = initialFileId || loadedData?.fileId;
  const fileName = initialFileName || loadedData?.fileName;

  const handleNavigateToStudy = () => {
    onClose();
    if (fileId) {
      router.push(
        `${paths.study}?fileId=${encodeURIComponent(fileId)}&fileName=${encodeURIComponent(fileName || '')}&view=live`
      );
    } else {
      router.push(paths.study);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2.5,
          p: 0,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuBookRoundedIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              관련 개념 노트
            </Typography>
            {fileName && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                출처: {fileName}
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">개념 노트를 불러오는 중...</Typography>
          </Box>
        ) : concept ? (
          <StudyConceptViewCard concept={concept} conceptIndex={0} totalConcepts={1} />
        ) : (
          <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">해당 개념을 찾을 수 없습니다.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, px: 3, borderTop: (t) => `1px solid ${t.palette.divider}`, gap: 1 }}
      >
        {fileId && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<OpenInNewIcon />}
            onClick={handleNavigateToStudy}
            sx={{ fontWeight: 700 }}
          >
            Study에서 전체 보기
          </Button>
        )}
        <Button variant="contained" color="inherit" onClick={onClose} sx={{ fontWeight: 700 }}>
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
