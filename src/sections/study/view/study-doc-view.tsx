'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import EditIcon from '@mui/icons-material/Edit';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';

import { useStudyDocView, StudyPagination, StudyConceptViewCard } from '../components';

// ----------------------------------------------------------------------

interface Props {
  fileId: string;
  fileName: string;
  onBack: () => void;
  onEdit: (conceptIndex?: number) => void;
  initialConceptIndex?: number;
}

export function StudyDocView({ fileId, fileName, onBack, onEdit, initialConceptIndex = 0 }: Props) {
  const {
    data,
    loading,
    currentIndex,
    pageInput,
    handlePrevConcept,
    handleNextConcept,
    handlePageInputChange,
    handlePageInputBlur,
    handlePageInputKeyDown,
  } = useStudyDocView({
    fileId,
    initialConceptIndex,
    onEdit,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!data || !data.concepts || data.concepts.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={onBack} sx={{ bgcolor: 'background.neutral' }}>
            <ArrowBackIosIcon sx={{ width: 16, height: 16, ml: 0.5 }} />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800 }}>
            {fileName}
          </Typography>
        </Box>
        <Box
          sx={{
            py: 10,
            textAlign: 'center',
            bgcolor: 'background.neutral',
            borderRadius: 2,
          }}
        >
          <MenuBookRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.disabled', mb: 3 }}>
            등록된 개념이 없습니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => onEdit(0)}
          >
            개념 등록하기
          </Button>
        </Box>
      </Container>
    );
  }

  const activeConcept = data.concepts[currentIndex] || data.concepts[0];
  const cIndex = currentIndex;

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 8 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 10,
          py: 1.5,
          mx: { xs: -2, md: -8 },
          px: { xs: 2, md: 8 },
        }}
      >
        <IconButton onClick={onBack} sx={{ bgcolor: 'background.neutral' }}>
          <ArrowBackIosIcon sx={{ width: 16, height: 16, ml: 0.5 }} />
        </IconButton>

        <Typography
          variant="h5"
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName}
        </Typography>

        {/* Header Pagination Controls */}
        <StudyPagination
          variant="header"
          currentIndex={currentIndex}
          totalConcepts={data.concepts.length}
          pageInput={pageInput}
          onPrev={handlePrevConcept}
          onNext={handleNextConcept}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
        />

        <Tooltip title="Edit (Ctrl + E)">
          <Button
            variant="contained"
            color="warning"
            onClick={() => onEdit(currentIndex)}
            startIcon={<EditIcon />}
            sx={{ boxShadow: (t) => t.customShadows?.warning }}
          >
            편집
          </Button>
        </Tooltip>
      </Box>

      {/* Main Concept View Card */}
      <StudyConceptViewCard
        concept={activeConcept}
        conceptIndex={cIndex}
        totalConcepts={data.concepts.length}
      />

      {/* Footer Navigation */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <StudyPagination
          variant="footer"
          currentIndex={currentIndex}
          totalConcepts={data.concepts.length}
          pageInput={pageInput}
          onPrev={handlePrevConcept}
          onNext={handleNextConcept}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
        />
      </Box>
    </Container>
  );
}
