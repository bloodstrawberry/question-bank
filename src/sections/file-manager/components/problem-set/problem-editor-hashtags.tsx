import { memo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TagIcon from '@mui/icons-material/Tag';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface ProblemEditorHashtagsProps {
  hashtags: string[];
  hashtagInput: string;
  onHashtagInputChange: (val: string) => void;
  onAddHashtag: (tag: string) => void;
  onRemoveHashtag: (tagIndex: number) => void;
}

export const ProblemEditorHashtags = memo(function ProblemEditorHashtags({
  hashtags,
  hashtagInput,
  onHashtagInputChange,
  onAddHashtag,
  onRemoveHashtag,
}: ProblemEditorHashtagsProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
        해시태그
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {hashtags.map((tag, tagIndex) => (
          <Chip
            key={tagIndex}
            label={tag}
            color="primary"
            variant="soft"
            onDelete={() => onRemoveHashtag(tagIndex)}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>
      <TextField
        size="small"
        placeholder="태그 입력 후 Enter"
        value={hashtagInput}
        onChange={(e) => onHashtagInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAddHashtag(hashtagInput);
          }
        }}
        slotProps={{
          input: {
            startAdornment: <TagIcon sx={{ color: 'text.disabled', mr: 0.5, fontSize: 18 }} />,
          },
        }}
        sx={{ maxWidth: 300 }}
      />
    </Box>
  );
});
