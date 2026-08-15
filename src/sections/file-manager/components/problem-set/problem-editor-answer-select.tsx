import type { Problem } from './types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { focusNextInput } from './focus-utils';

interface ProblemEditorAnswerSelectProps {
  problem: Problem;
  onUpdateProblem: (updates: Partial<Problem>) => void;
}

export function ProblemEditorAnswerSelect({
  problem,
  onUpdateProblem,
}: ProblemEditorAnswerSelectProps) {
  const choicesCount = problem.choices.length;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
      {!problem.isMultipleAnswer ? (
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>정답 번호</InputLabel>
          <Select
            label="정답 번호"
            value={problem.answer || ''}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const handled = focusNextInput(e.currentTarget, e.shiftKey);
                if (handled) e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val = e.target.value as number;
              onUpdateProblem({ answer: val, answers: val ? [val] : [] });
            }}
          >
            <MenuItem value="">
              <em>미지정</em>
            </MenuItem>
            {Array.from({ length: choicesCount }, (_, i) => i + 1).map((num) => (
              <MenuItem key={num} value={num}>
                {num}번
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>정답 번호 (복수 선택)</InputLabel>
          <Select
            multiple
            label="정답 번호 (복수 선택)"
            value={problem.answers || []}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const handled = focusNextInput(e.currentTarget, e.shiftKey);
                if (handled) e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val =
                typeof e.target.value === 'string'
                  ? e.target.value.split(',').map(Number)
                  : (e.target.value as number[]);
              const sorted = [...val].sort((a, b) => a - b);
              onUpdateProblem({
                answers: sorted,
                answer: sorted[0] || 0,
              });
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[])
                  .sort((a, b) => a - b)
                  .map((num) => (
                    <Chip key={num} size="small" label={`${num}번`} color="primary" />
                  ))}
              </Box>
            )}
          >
            {Array.from({ length: choicesCount }, (_, i) => i + 1).map((num) => (
              <MenuItem key={num} value={num}>
                <Checkbox checked={(problem.answers || []).indexOf(num) > -1} />
                <ListItemText primary={`${num}번`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={Boolean(problem.isMultipleAnswer)}
            inputProps={{ tabIndex: -1 }}
            onChange={(e) => {
              const checked = e.target.checked;
              const currentAnswers =
                problem.answers && problem.answers.length > 0
                  ? problem.answers
                  : problem.answer
                    ? [problem.answer]
                    : [];
              onUpdateProblem({
                isMultipleAnswer: checked,
                answers: currentAnswers,
                showMultipleCount: problem.showMultipleCount !== false,
              });
            }}
            color="primary"
          />
        }
        label={
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            복수 정답
          </Typography>
        }
      />

      {problem.isMultipleAnswer && (
        <FormControlLabel
          control={
            <Switch
              checked={problem.showMultipleCount !== false}
              inputProps={{ tabIndex: -1 }}
              onChange={(e) => onUpdateProblem({ showMultipleCount: e.target.checked })}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              문제에 정답 개수 표시 ({`정답 ${(problem.answers || []).length}개`})
            </Typography>
          }
        />
      )}
    </Box>
  );
}
