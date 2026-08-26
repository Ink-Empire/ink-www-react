import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '@/styles/colors';

interface EditableSectionProps {
  label: string;
  editing: boolean;
  editor?: React.ReactNode;
  emptyHint?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a section of the public studio page with an edit affordance.
 *
 * The public section components are rendered untouched, so nothing about the
 * live page can regress through the editor. When the section is opened its
 * editor replaces the rendered section in place; in preview mode the wrapper
 * disappears entirely and only the section shows.
 */
const EditableSection: React.FC<EditableSectionProps> = ({
  label,
  editing,
  editor,
  emptyHint,
  isEmpty = false,
  children,
}) => {
  const [open, setOpen] = useState(false);

  if (!editing) {
    return <>{children}</>;
  }

  if (open && editor) {
    return (
      <Box sx={{
        position: 'relative',
        borderRadius: '12px',
        border: `1px solid ${colors.accent}`,
        p: 2,
        mb: 3,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>
            {label}
          </Typography>
          <Button
            onClick={() => setOpen(false)}
            startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
            sx={{ color: colors.textSecondary, textTransform: 'none' }}
            size="small"
          >
            Done
          </Button>
        </Box>
        {editor}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '12px',
        outline: `1px dashed ${colors.border}`,
        outlineOffset: 4,
        mb: 3,
        '&:hover': { outlineColor: colors.accent },
        '&:hover .section-edit': { opacity: 1 },
      }}
    >
      {editor && (
        <Button
          className="section-edit"
          onClick={() => setOpen(true)}
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            opacity: 0.85,
            transition: 'opacity 0.15s',
            bgcolor: colors.accent,
            color: colors.background,
            textTransform: 'none',
            '&:hover': { bgcolor: colors.accent },
          }}
        >
          Edit {label.toLowerCase()}
        </Button>
      )}

      {isEmpty && emptyHint ? (
        <Box sx={{
          p: 3,
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: '0.9rem',
        }}>
          {emptyHint}
        </Box>
      ) : (
        children
      )}
    </Box>
  );
};

export default EditableSection;
