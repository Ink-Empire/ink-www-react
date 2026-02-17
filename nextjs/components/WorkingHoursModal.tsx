import React, { useState } from 'react';
import { Box, Typography, IconButton, Modal, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkingHoursEditor from './WorkingHoursEditor';
import { colors, modalStyles } from '@/styles/colors';
import { WorkingHour } from '@inkedin/shared/types';

// Re-export for backwards compatibility with existing imports
export type { WorkingHour } from '@inkedin/shared/types';

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workingHours: WorkingHour[]) => Promise<void> | void;
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
  const [saving, setSaving] = useState(false);

  // Determine entity type and ID
  const entityType = studioId ? 'studio' : 'artist';
  const entityId = studioId || artistId || 0;

  // Handle changes from editor
  const handleEditorChange = (hours: WorkingHour[]) => {
    setPendingHours(hours);
  };

  // Handle save with loading state
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(pendingHours);
    } finally {
      setSaving(false);
    }
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
          {infoText && (
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              p: '1rem',
              mb: '1rem',
              bgcolor: `${colors.accent}26`,
              border: `1px solid ${colors.accent}33`,
              borderRadius: '8px'
            }}>
              <Box sx={{ color: colors.accent, flexShrink: 0, mt: '2px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                {infoText}
              </Typography>
            </Box>
          )}
          <WorkingHoursEditor
            initialHours={initialWorkingHours}
            onChange={handleEditorChange}
            entityId={entityId}
            entityType={entityType}
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
            disabled={saving}
            sx={{
              px: '1.5rem',
              py: '0.7rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              border: `1px solid ${colors.borderLight}`,
              bgcolor: 'transparent',
              color: colors.textPrimary,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.5 : 1,
              '&:hover': {
                borderColor: saving ? colors.borderLight : colors.accent,
                color: saving ? colors.textPrimary : colors.accent
              }
            }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={handleSave}
            disabled={saving}
            sx={{
              px: '1.5rem',
              py: '0.7rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              border: 'none',
              bgcolor: colors.accent,
              color: colors.background,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': { bgcolor: saving ? colors.accent : colors.accentHover }
            }}
          >
            {saving && <CircularProgress size={16} sx={{ color: colors.background }} />}
            {saving ? 'Saving...' : 'Save Hours'}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default WorkingHoursModal;
