'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha } from '@mui/material/styles';

interface ProblemEditorCollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  hasContent?: boolean;
  color?: 'primary' | 'info' | 'secondary' | 'default';
  expanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function ProblemEditorCollapsibleSection({
  title,
  icon,
  count,
  hasContent = false,
  color = 'primary',
  expanded,
  onToggle,
  action,
  children,
}: ProblemEditorCollapsibleSectionProps) {
  const displayCount = typeof count === 'number' ? count : 0;
  const isPopulated = hasContent || displayCount > 0;

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.2)}`,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: (t) => t.transitions.create(['border-color', 'box-shadow']),
        ...(expanded && {
          borderColor: (t) =>
            color === 'info' ? alpha(t.palette.info.main, 0.4) : alpha(t.palette.primary.main, 0.4),
        }),
      }}
    >
      {/* Collapsible Header */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
          bgcolor: (t) =>
            expanded
              ? color === 'info'
                ? alpha(t.palette.info.main, 0.04)
                : alpha(t.palette.primary.main, 0.04)
              : alpha(t.palette.grey[500], 0.03),
          '&:hover': {
            bgcolor: (t) =>
              expanded
                ? color === 'info'
                  ? alpha(t.palette.info.main, 0.08)
                  : alpha(t.palette.primary.main, 0.08)
                : alpha(t.palette.grey[500], 0.08),
          },
          transition: (t) => t.transitions.create(['background-color']),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            sx={{
              p: 0.25,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: (t) =>
                t.transitions.create('transform', {
                  duration: t.transitions.duration.shortest,
                }),
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>

          {icon}

          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>

          {typeof count === 'number' ? (
            count > 0 ? (
              <Chip
                label={`${count}개`}
                size="small"
                color={color}
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            ) : (
              <Chip
                label="접힘"
                size="small"
                color="default"
                variant="soft"
                sx={{ height: 20, fontSize: 11, fontWeight: 600, opacity: 0.6 }}
              />
            )
          ) : isPopulated ? (
            <Chip
              label="작성됨"
              size="small"
              color={color}
              variant="soft"
              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
            />
          ) : (
            <Chip
              label="접힘"
              size="small"
              color="default"
              variant="soft"
              sx={{ height: 20, fontSize: 11, fontWeight: 600, opacity: 0.6 }}
            />
          )}
        </Box>

        {action && (
          <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
            {action}
          </Box>
        )}
      </Box>

      {/* Collapse Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
        <Box
          sx={{
            p: 2,
            borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
