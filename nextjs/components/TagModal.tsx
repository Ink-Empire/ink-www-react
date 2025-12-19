import React, { useState, useEffect } from 'react';
import { useTags } from '../contexts/TagContext';
import { Box, Typography, Button, Checkbox, IconButton, TextField, InputAdornment } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { colors } from '@/styles/colors';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (tags: number[]) => void;
  selectedTags: number[];
  maxTags?: number;
}

const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  onApply,
  selectedTags: initialSelectedTags,
  maxTags = 10
}) => {
  const { tags } = useTags();
  const [localSelectedTags, setLocalSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize local state when the modal opens or selected tags change
  useEffect(() => {
    setLocalSelectedTags([...initialSelectedTags]);
  }, [initialSelectedTags, isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Toggle a tag selection
  const toggleTag = (tagId: number) => {
    if (localSelectedTags.includes(tagId)) {
      setLocalSelectedTags(localSelectedTags.filter(id => id !== tagId));
    } else if (localSelectedTags.length < maxTags) {
      setLocalSelectedTags([...localSelectedTags, tagId]);
    }
  };

  // Check if a tag is selected
  const isSelected = (tagId: number) => {
    return localSelectedTags.includes(tagId);
  };

  // Clear all selections
  const clearAll = () => {
    setLocalSelectedTags([]);
  };

  // Handle apply button click
  const handleApply = () => {
    onApply(localSelectedTags);
    onClose();
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        bgcolor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          bgcolor: colors.surface,
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
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
            <Box>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Select Tags
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                {localSelectedTags.length}/{maxTags} selected
              </Typography>
            </Box>
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

        {/* Search */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.textMuted, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: colors.background,
                borderRadius: '8px',
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.textMuted },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
                color: colors.textPrimary,
                '& input::placeholder': { color: colors.textMuted, opacity: 1 },
              },
            }}
          />
        </Box>

        {/* Clear all option */}
        {localSelectedTags.length > 0 && (
          <Box
            sx={{
              px: 2.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Button
              onClick={clearAll}
              sx={{
                color: colors.textSecondary,
                fontSize: '0.8rem',
                textTransform: 'none',
                '&:hover': { color: colors.accent, bgcolor: 'transparent' },
              }}
            >
              Clear all
            </Button>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
          {filteredTags.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                {searchQuery ? 'No tags found' : 'No tags available'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
              {filteredTags.map((tag) => (
                <Box
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '100px',
                    cursor: localSelectedTags.length >= maxTags && !isSelected(tag.id) ? 'not-allowed' : 'pointer',
                    bgcolor: isSelected(tag.id) ? colors.accent : 'transparent',
                    border: `1px solid ${isSelected(tag.id) ? colors.accent : colors.border}`,
                    color: isSelected(tag.id) ? colors.background : colors.textPrimary,
                    fontSize: '0.85rem',
                    fontWeight: isSelected(tag.id) ? 600 : 400,
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                    opacity: localSelectedTags.length >= maxTags && !isSelected(tag.id) ? 0.5 : 1,
                    '&:hover': {
                      bgcolor: isSelected(tag.id) ? colors.accentHover : `${colors.accent}1A`,
                      borderColor: colors.accent,
                    },
                  }}
                >
                  {tag.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TagModal;
