import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import { FastTextField } from './fast-text-field';

interface ProblemEditorChoicesProps {
  choices: string[];
  answers?: number[];
  answer: number;
  isMultipleAnswer?: boolean;
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onChangeChoice: (choiceIndex: number, value: string) => void;
  onOpenBulkDialog: () => void;
}

export function ProblemEditorChoices({
  choices = [],
  answers = [],
  answer = 0,
  isMultipleAnswer = false,
  onAddChoice,
  onRemoveChoice,
  onChangeChoice,
  onOpenBulkDialog,
}: ProblemEditorChoicesProps) {
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {choices.map((choice, cIndex) => {
          const isThisChoiceCorrect = isMultipleAnswer
            ? answers.includes(cIndex + 1)
            : answer === cIndex + 1;

          return (
            <Box
              key={cIndex}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
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
              <IconButton
                size="small"
                color="error"
                disabled={choices.length <= 2}
                onClick={() => onRemoveChoice(cIndex)}
                title="선택지 삭제"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
