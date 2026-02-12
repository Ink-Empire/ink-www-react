import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import CollectionsIcon from '@mui/icons-material/Collections';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import { BulkUploadItem } from '@/hooks/useBulkUpload';
import { useStyles } from '@/contexts/StyleContext';
import { api } from '@/utils/api';
import { colors } from '@/styles/colors';

interface Placement {
  id: number;
  name: string;
  slug: string;
}

interface ItemDetailModalProps {
  item: BulkUploadItem;
  onClose: () => void;
  onUpdate: (itemId: number, data: any) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ItemDetailModal({
  item,
  onClose,
  onUpdate,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: ItemDetailModalProps) {
  const { styles: tattooStyles, loading: stylesLoading } = useStyles();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [placementId, setPlacementId] = useState<number | ''>(item.placement_id || '');
  const [primaryStyleId, setPrimaryStyleId] = useState<number | ''>(item.primary_style_id || '');
  const [additionalStyleIds, setAdditionalStyleIds] = useState<number[]>(item.additional_style_ids || []);
  const [approvedTagIds, setApprovedTagIds] = useState<number[]>(item.approved_tag_ids || []);
  const [isSkipped, setIsSkipped] = useState(item.is_skipped);
  const [applyToGroup, setApplyToGroup] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset form when item changes
  useEffect(() => {
    setTitle(item.title || '');
    setDescription(item.description || '');
    setPlacementId(item.placement_id || '');
    setPrimaryStyleId(item.primary_style_id || '');
    setAdditionalStyleIds(item.additional_style_ids || []);
    setApprovedTagIds(item.approved_tag_ids || []);
    setIsSkipped(item.is_skipped);
    setApplyToGroup(false);
    setActiveImageIndex(0);
    setError(null);
  }, [item]);

  // Fetch placements
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Placement[] }>('/placements');
        if (response.success && response.data) {
          setPlacements(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch placements:', err);
      } finally {
        setPlacementsLoading(false);
      }
    };
    fetchPlacements();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, {
        title: title || null,
        description: description || null,
        placement_id: placementId || null,
        primary_style_id: primaryStyleId || null,
        additional_style_ids: additionalStyleIds,
        approved_tag_ids: approvedTagIds,
        is_skipped: isSkipped,
        apply_to_group: applyToGroup && item.group_count > 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    if (hasNext) {
      onNext();
    } else {
      onClose();
    }
  };

  const toggleStyle = (styleId: number) => {
    if (styleId === primaryStyleId) {
      return;
    }
    if (additionalStyleIds.includes(styleId)) {
      setAdditionalStyleIds(additionalStyleIds.filter((id) => id !== styleId));
    } else {
      setAdditionalStyleIds([...additionalStyleIds, styleId]);
    }
  };

  const handlePrimaryStyleChange = (styleId: number) => {
    const oldPrimaryId = primaryStyleId;
    setPrimaryStyleId(styleId);
    if (oldPrimaryId && oldPrimaryId !== styleId) {
      if (!additionalStyleIds.includes(oldPrimaryId)) {
        setAdditionalStyleIds([...additionalStyleIds, oldPrimaryId]);
      }
    }
    setAdditionalStyleIds(additionalStyleIds.filter((id) => id !== styleId));
  };

  const toggleTag = (tagId: number) => {
    if (approvedTagIds.includes(tagId)) {
      setApprovedTagIds(approvedTagIds.filter((id) => id !== tagId));
    } else {
      setApprovedTagIds([...approvedTagIds, tagId]);
    }
  };

  const isReady = primaryStyleId !== '' && placementId !== '';

  const allImages = item.group_items && item.group_items.length > 0
    ? item.group_items
    : [{ id: item.id, thumbnail_url: item.thumbnail_url, is_primary: true }];

  // Dark theme input styles
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: colors.textPrimary,
      '& fieldset': { borderColor: colors.border },
      '&:hover fieldset': { borderColor: colors.textSecondary },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
    '& .MuiInputLabel-root': {
      color: colors.textSecondary,
      '&.Mui-focused': { color: colors.accent },
    },
    '& .MuiSelect-icon': { color: colors.textSecondary },
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 500 }}>
          {/* Image Section */}
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              bgcolor: colors.background,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 300, md: 'auto' },
            }}
          >
            {/* Navigation buttons */}
            <IconButton
              onClick={onPrev}
              disabled={!hasPrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.6)',
                color: colors.textPrimary,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: colors.textMuted },
                zIndex: 1,
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={onNext}
              disabled={!hasNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.6)',
                color: colors.textPrimary,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: colors.textMuted },
                zIndex: 1,
              }}
            >
              <ChevronRightIcon />
            </IconButton>

            {/* Main Image */}
            {allImages[activeImageIndex]?.thumbnail_url ? (
              <Box
                component="img"
                src={allImages[activeImageIndex].thumbnail_url}
                alt={item.filename}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Typography sx={{ color: colors.textSecondary }}>No image</Typography>
            )}

            {/* Carousel thumbnails */}
            {allImages.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {allImages.map((img, index) => (
                  <Box
                    key={img.id}
                    onClick={() => setActiveImageIndex(index)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: index === activeImageIndex ? `2px solid ${colors.accent}` : '2px solid transparent',
                    }}
                  >
                    {img.thumbnail_url && (
                      <Box
                        component="img"
                        src={img.thumbnail_url}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Carousel badge */}
            {item.group_count > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <CollectionsIcon sx={{ fontSize: 16, color: 'white' }} />
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {item.group_count} images
                </Typography>
              </Box>
            )}

            {/* Close button */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: colors.textPrimary,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Section */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, p: 3, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: colors.textPrimary }}>
              {item.filename}
            </Typography>

            {item.original_caption && (
              <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
                Original: {item.original_caption.substring(0, 100)}
                {item.original_caption.length > 100 ? '...' : ''}
              </Typography>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  bgcolor: `${colors.error}15`,
                  color: colors.error,
                  border: `1px solid ${colors.error}`,
                  '& .MuiAlert-icon': { color: colors.error },
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Skip Toggle */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: isSkipped ? colors.background : 'transparent',
                borderRadius: 1,
                border: `1px solid ${isSkipped ? colors.border : 'transparent'}`,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={isSkipped}
                    onChange={(e) => setIsSkipped(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colors.textMuted,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: colors.textMuted,
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon sx={{ fontSize: 20, color: isSkipped ? colors.textSecondary : colors.textMuted }} />
                    <Typography sx={{ color: isSkipped ? colors.textPrimary : colors.textSecondary }}>
                      Skip this image
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {!isSkipped && (
              <>
                {/* Title */}
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this tattoo a title"
                  sx={{ mb: 3, ...inputSx }}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this tattoo"
                  sx={{ mb: 3, ...inputSx }}
                />

                {/* Placement */}
                <FormControl fullWidth sx={{ mb: 3, ...inputSx }}>
                  <InputLabel>Placement *</InputLabel>
                  <Select
                    value={placementId}
                    onChange={(e) => setPlacementId(e.target.value as number)}
                    label="Placement *"
                    disabled={placementsLoading}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          '& .MuiMenuItem-root': {
                            color: colors.textPrimary,
                            '&:hover': { bgcolor: colors.background },
                            '&.Mui-selected': { bgcolor: colors.background },
                          },
                        },
                      },
                    }}
                  >
                    {placements.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Primary Style */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: colors.textPrimary }}>
                    Primary Style *
                  </Typography>
                  {stylesLoading ? (
                    <CircularProgress size={24} sx={{ color: colors.accent }} />
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tattooStyles.map((style) => (
                        <Chip
                          key={style.id}
                          label={style.name}
                          onClick={() => handlePrimaryStyleChange(style.id)}
                          sx={{
                            bgcolor: primaryStyleId === style.id ? colors.accent : 'transparent',
                            color: primaryStyleId === style.id ? colors.background : colors.textSecondary,
                            borderColor: primaryStyleId === style.id ? colors.accent : colors.border,
                            border: '1px solid',
                            '&:hover': {
                              bgcolor: primaryStyleId === style.id ? colors.accentHover : colors.background,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Additional Styles */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: colors.textPrimary }}>
                    Additional Styles
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tattooStyles
                      .filter((s) => s.id !== primaryStyleId)
                      .map((style) => (
                        <Chip
                          key={style.id}
                          label={style.name}
                          onClick={() => toggleStyle(style.id)}
                          size="small"
                          sx={{
                            bgcolor: additionalStyleIds.includes(style.id) ? colors.background : 'transparent',
                            color: additionalStyleIds.includes(style.id) ? colors.textPrimary : colors.textSecondary,
                            borderColor: additionalStyleIds.includes(style.id) ? colors.textSecondary : colors.border,
                            border: '1px solid',
                            '&:hover': {
                              bgcolor: colors.background,
                            },
                          }}
                        />
                      ))}
                  </Box>
                </Box>

                {/* AI Suggested Tags */}
                {item.ai_suggested_tags && item.ai_suggested_tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 18, color: colors.accent }} />
                      <Typography variant="subtitle2" sx={{ color: colors.textPrimary }}>
                        AI Suggested Tags
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {item.ai_suggested_tags.map((tag) => {
                        const isApproved = approvedTagIds.includes(tag.id);
                        return (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            onClick={() => toggleTag(tag.id)}
                            icon={isApproved ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
                            size="small"
                            sx={{
                              bgcolor: isApproved ? colors.successDim : 'transparent',
                              color: isApproved ? colors.success : colors.textSecondary,
                              borderColor: isApproved ? colors.success : colors.accent,
                              border: '1px solid',
                              '& .MuiChip-icon': {
                                color: isApproved ? colors.success : colors.accent,
                              },
                              '&:hover': {
                                bgcolor: isApproved ? colors.successDim : colors.background,
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: colors.textMuted }}>
                      Click tags to approve them
                    </Typography>
                  </Box>
                )}

                {/* Apply to group */}
                {item.group_count > 1 && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: colors.infoDim,
                      borderRadius: 1,
                      border: `1px solid ${colors.info}`,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={applyToGroup}
                          onChange={(e) => setApplyToGroup(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.info,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              bgcolor: colors.info,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                          Apply these settings to all {item.group_count} images in this post
                        </Typography>
                      }
                    />
                  </Box>
                )}

                {/* Ready indicator */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: isReady ? colors.successDim : colors.warningDim,
                    border: `1px solid ${isReady ? colors.success : colors.warning}`,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: isReady ? colors.success : colors.warning, fontWeight: 500 }}
                  >
                    {isReady
                      ? 'Ready to publish'
                      : 'Add placement and style to mark as ready'}
                  </Typography>
                </Box>
              </>
            )}

            <Divider sx={{ my: 2, borderColor: colors.border }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  flex: 1,
                  minWidth: 100,
                  color: colors.textSecondary,
                  borderColor: colors.border,
                  '&:hover': { borderColor: colors.textSecondary, bgcolor: colors.background },
                }}
              >
                Cancel
              </Button>
              {hasNext ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      flex: 1,
                      minWidth: 100,
                      bgcolor: colors.accent,
                      color: colors.background,
                      '&:hover': { bgcolor: colors.accentHover },
                      '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveAndNext}
                    disabled={saving}
                    sx={{
                      flex: 1,
                      minWidth: 100,
                      bgcolor: colors.success,
                      color: '#fff',
                      '&:hover': { bgcolor: '#3d8269' },
                      '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save & Next'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSaveAndNext}
                  disabled={saving}
                  sx={{
                    flex: 1,
                    minWidth: 100,
                    bgcolor: colors.accent,
                    color: colors.background,
                    '&:hover': { bgcolor: colors.accentHover },
                    '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
