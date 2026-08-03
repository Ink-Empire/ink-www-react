import React, { useState, useEffect } from 'react';
import { useStyles } from '../contexts/StyleContext';
import { Box, Typography, Button, Checkbox, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors, modalStyles } from '@/styles/colors';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (styles: number[]) => void;
  selectedStyles: number[];
}

const StyleModal: React.FC<StyleModalProps> = ({ isOpen, onClose, onApply, selectedStyles: initialSelectedStyles }) => {
  const { styles } = useStyles();
  const [localSelectedStyles, setLocalSelectedStyles] = useState<number[]>([]);

  // Initialize local state when the modal opens or selected styles change
  useEffect(() => {
    setLocalSelectedStyles([...initialSelectedStyles]);
  }, [initialSelectedStyles, isOpen]);

  // Toggle a style selection
  const toggleStyle = (styleId: number) => {
    if (localSelectedStyles.includes(styleId)) {
      setLocalSelectedStyles(localSelectedStyles.filter(id => id !== styleId));
    } else {
      setLocalSelectedStyles([...localSelectedStyles, styleId]);
    }
  };

  // Check if a style is selected
  const isSelected = (styleId: number) => {
    return localSelectedStyles.includes(styleId);
  };

  // Select or deselect all styles
  const toggleSelectAll = () => {
    if (localSelectedStyles.length > 0) {
      setLocalSelectedStyles([]);
    } else {
      setLocalSelectedStyles(styles.map(style => style.id));
    }
  };

  // Check if any styles are selected
  const hasAnyChecked = () => {
    return localSelectedStyles.length > 0;
  };

  // Handle apply button click
  const handleApply = () => {
    onApply(localSelectedStyles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...modalStyles.backdrop,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
          ...modalStyles.paper,
          mx: 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: colors.background,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={onClose}
              sx={{
                color: colors.textSecondary,
                p: 0.5,
                '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' },
              }}
              aria-label="Close"
            >
              <CloseIcon sx={{ fontSize: 22 }} />
            </IconButton>
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              Select Styles
            </Typography>
          </Box>
          <Button
            onClick={handleApply}
            sx={{
              px: 2.5,
              py: 0.75,
              bgcolor: colors.accent,
              color: colors.background,
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: colors.accentHover,
              },
            }}
          >
            Apply
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {/* Select All option */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`,
              cursor: 'pointer',
              '&:hover': { bgcolor: `${colors.accent}0D` },
            }}
            onClick={toggleSelectAll}
          >
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              {hasAnyChecked() ? 'Deselect All' : 'Select All'}
            </Typography>
            <Checkbox
              checked={hasAnyChecked() && localSelectedStyles.length === styles.length}
              onChange={toggleSelectAll}
              sx={{
                color: colors.textMuted,
                '&.Mui-checked': { color: colors.accent },
                p: 0,
              }}
            />
          </Box>

          {/* Style options */}
          {styles.map((style) => (
            <Box
              key={style.id}
              sx={{
                px: 2.5,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer',
                bgcolor: isSelected(style.id) ? `${colors.accent}1A` : 'transparent',
                '&:hover': { bgcolor: isSelected(style.id) ? `${colors.accent}26` : `${colors.accent}0D` },
                '&:last-child': { borderBottom: 'none' },
              }}
              onClick={() => toggleStyle(style.id)}
            >
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: isSelected(style.id) ? 600 : 400,
                  color: isSelected(style.id) ? colors.accent : colors.textPrimary,
                }}
              >
                {style.name}
              </Typography>
              <Checkbox
                checked={isSelected(style.id)}
                onChange={() => toggleStyle(style.id)}
                sx={{
                  color: colors.textMuted,
                  '&.Mui-checked': { color: colors.accent },
                  p: 0,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default StyleModal;
