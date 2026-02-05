import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkingHoursEditor from './WorkingHoursEditor';
import { colors, modalStyles } from '@/styles/colors';
import { WorkingHour } from '@inkedin/shared/types';

// Re-export for backwards compatibility with existing imports
export type { WorkingHour } from '@inkedin/shared/types';

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workingHours: WorkingHour[]) => void;
  artistId?: number;
  studioId?: number;
  initialWorkingHours?: WorkingHour[];
  title?: string;
  infoText?: string;
}

const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({
  isOpen,
  onClose,
  onSave,
  artistId,
  studioId,
  initialWorkingHours,
  title = "Your Hours",
  infoText,
}) => {
  const [pendingHours, setPendingHours] = useState<WorkingHour[]>([]);

  // Determine entity type and ID
  const entityType = studioId ? 'studio' : 'artist';
  const entityId = studioId || artistId || 0;

  // Handle changes from editor
  const handleEditorChange = (hours: WorkingHour[]) => {
    setPendingHours(hours);
  };

  // Handle save
  const handleSave = () => {
    // API uses 0-6 (0 = Sunday), same as editor
    onSave(pendingHours);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '1rem'
      }}
      slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
    >
      <Box sx={{
        ...modalStyles.paper,
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none'
      }}>
        {/* Modal Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: '1.25rem 1.5rem',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <Typography sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: colors.textPrimary,
            fontFamily: "'Cormorant Garamond', Georgia, serif"
          }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: colors.textSecondary,
              p: '0.25rem',
              '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Body */}
        <Box sx={{
          p: '1.5rem',
          overflowY: 'auto',
          flex: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: colors.background,
            borderRadius: 3
          }
        }}>
          <WorkingHoursEditor
            initialHours={initialWorkingHours}
            onChange={handleEditorChange}
            entityId={entityId}
            entityType={entityType}
            infoText={infoText}
          />
        </Box>

        {/* Modal Footer */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          p: '1.25rem 1.5rem',
          borderTop: `1px solid ${colors.border}`
        }}>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              px: '1.5rem',
              py: '0.7rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: `1px solid ${colors.borderLight}`,
              bgcolor: 'transparent',
              color: colors.textPrimary,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent
              }
            }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={handleSave}
            sx={{
              px: '1.5rem',
              py: '0.7rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              bgcolor: colors.accent,
              color: colors.background,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: colors.accentHover }
            }}
          >
            Save Hours
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default WorkingHoursModal;
