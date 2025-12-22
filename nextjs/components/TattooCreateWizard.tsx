import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack,
  ArrowForward,
  Check as CheckIcon,
  AutoAwesome as AiIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useStyles } from '../contexts/StyleContext';
import { api } from '../utils/api';
import { colors } from '@/styles/colors';
import TagsAutocomplete, { Tag } from './TagsAutocomplete';

interface TattooCreateWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const steps = ['Upload', 'Details', 'Review'];

const placementOptions = [
  'Arm', 'Forearm', 'Upper Arm', 'Wrist', 'Hand', 'Finger',
  'Leg', 'Thigh', 'Calf', 'Ankle', 'Foot',
  'Back', 'Upper Back', 'Lower Back', 'Spine',
  'Chest', 'Ribs', 'Stomach', 'Side',
  'Shoulder', 'Neck', 'Behind Ear',
  'Full Sleeve', 'Half Sleeve', 'Full Back',
  'Other'
];

const sizeOptions = [
  'Tiny (< 2 inches)',
  'Small (2-4 inches)',
  'Medium (4-6 inches)',
  'Large (6-10 inches)',
  'Extra Large (10+ inches)',
  'Full Sleeve',
  'Half Sleeve',
  'Full Back'
];

const TattooCreateWizard: React.FC<TattooCreateWizardProps> = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { styles: tattooStyles, loading: stylesLoading } = useStyles();

  // Wizard state
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Upload (supports multiple images)
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const MAX_IMAGES = 5;

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [placement, setPlacement] = useState('');
  const [size, setSize] = useState('');
  const [hoursToComplete, setHoursToComplete] = useState<number | ''>();

  // Step 3: Review
  const [isPublic, setIsPublic] = useState(true);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI suggestions modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Tag[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
  const [createdTattooId, setCreatedTattooId] = useState<number | null>(null);
  const [addingTag, setAddingTag] = useState<number | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const resetForm = () => {
    setActiveStep(0);
    previews.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setPreviews([]);
    setTitle('');
    setDescription('');
    setSelectedStyles([]);
    setSelectedTags([]);
    setPlacement('');
    setSize('');
    setHoursToComplete('');
    setIsPublic(true);
    setError(null);
    setAiSuggestions([]);
    setAddedSuggestions(new Set());
    setCreatedTattooId(null);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
  }, [images.length]);

  const handleFilesSelect = (newFiles: File[]) => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToAdd: File[] = [];
    const previewsToAdd: string[] = [];

    for (const file of newFiles) {
      if (filesToAdd.length >= remainingSlots) {
        setError(`Only ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''} can be added`);
        break;
      }

      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Images must be smaller than 10MB');
        continue;
      }

      filesToAdd.push(file);
      previewsToAdd.push(URL.createObjectURL(file));
    }

    if (filesToAdd.length > 0) {
      setImages(prev => [...prev, ...filesToAdd]);
      setPreviews(prev => [...prev, ...previewsToAdd]);
      if (!error || error.includes('more image')) {
        setError(null);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Style toggle
  const toggleStyle = (styleId: number) => {
    if (selectedStyles.includes(styleId)) {
      setSelectedStyles(selectedStyles.filter(id => id !== styleId));
    } else {
      setSelectedStyles([...selectedStyles, styleId]);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    if (activeStep === 1 && !title.trim()) {
      setError('Please provide a title');
      return;
    }

    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();

      // Add all images (use files[] for Laravel array syntax)
      images.forEach(image => {
        formData.append('files[]', image);
      });

      // Add form fields
      formData.append('title', title.trim());
      formData.append('description', description.trim() || title.trim());
      formData.append('placement', placement);
      formData.append('size', size);
      formData.append('is_public', isPublic ? '1' : '0');

      if (hoursToComplete !== '' && hoursToComplete !== undefined) {
        formData.append('hours_to_complete', hoursToComplete.toString());
      }

      // Add styles
      if (selectedStyles.length > 0) {
        formData.append('style_ids', JSON.stringify(selectedStyles));
        formData.append('primary_style_id', selectedStyles[0].toString());
      }

      // Add tags
      if (selectedTags.length > 0) {
        formData.append('tag_ids', JSON.stringify(selectedTags.map(t => t.id)));
      }

      const response = await api.post<{
        tattoo: any;
        ai_suggested_tags: Tag[];
      }>('/tattoos/create', formData, {
        requiresAuth: true
      });

      console.log('Tattoo created:', response);

      // Check if we have AI suggestions to show
      const suggestions = response.ai_suggested_tags || [];
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setCreatedTattooId(response.tattoo?.id || null);
        setAddedSuggestions(new Set());
        setShowSuggestionsModal(true);
      } else {
        // No suggestions, finish up
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }

    } catch (error) {
      console.error('Failed to create tattoo:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tattoo post');
    } finally {
      setSubmitting(false);
    }
  };

  // Add an AI-suggested tag to the tattoo
  const handleAddSuggestion = async (tag: Tag) => {
    if (!createdTattooId || addedSuggestions.has(tag.id)) return;

    setAddingTag(tag.id);
    try {
      await api.post(`/tattoos/${createdTattooId}/tags/add`, {
        tag_id: tag.id
      }, { requiresAuth: true });

      setAddedSuggestions(prev => new Set([...prev, tag.id]));
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setAddingTag(null);
    }
  };

  // Close suggestions modal and finish
  const handleCloseSuggestions = () => {
    setShowSuggestionsModal(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return images.length > 0;
      case 1:
        // Only require title - styles are optional
        return title.trim() !== '';
      case 2:
        return true;
      default:
        return false;
    }
  };

  // Step 1: Upload
  const renderUploadStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary, fontWeight: 600 }}>
        Upload Your Tattoo
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: colors.textSecondary }}>
        Share your best work with the community (up to {MAX_IMAGES} images)
      </Typography>

      {/* Image Thumbnails Grid */}
      {previews.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 2
          }}>
            {previews.map((preview, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: index === 0 ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                }}
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {index === 0 && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: colors.accent,
                    color: colors.background,
                    textAlign: 'center',
                    py: 0.25,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    PRIMARY
                  </Box>
                )}
                <IconButton
                  onClick={(e) => {
                    e.preventDefault();
                    removeImage(index);
                  }}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    p: 0.5,
                    '&:hover': { bgcolor: colors.error }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: colors.textMuted, mt: 1, display: 'block' }}>
            {images.length} of {MAX_IMAGES} images • First image is the primary image
          </Typography>
        </Box>
      )}

      {/* Drag & Drop Zone - always show if under max */}
      {images.length < MAX_IMAGES && (
        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${isDragging ? colors.accent : colors.border}`,
            borderRadius: 2,
            p: previews.length > 0 ? 3 : 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: isDragging ? 'rgba(201, 169, 98, 0.1)' : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            minHeight: previews.length > 0 ? 120 : 250,
            position: 'relative',
            '&:hover': {
              borderColor: colors.accent,
              bgcolor: 'rgba(201, 169, 98, 0.05)'
            }
          }}
          component="label"
        >
          <CloudUploadIcon sx={{ fontSize: previews.length > 0 ? 32 : 48, color: colors.textSecondary, mb: 1 }} />
          <Typography variant={previews.length > 0 ? "body2" : "h6"} sx={{ color: colors.textPrimary, mb: 0.5 }}>
            {previews.length > 0 ? 'Add more images' : 'Drag & drop your images here'}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
            or click to browse
          </Typography>
          {previews.length === 0 && (
            <Typography variant="caption" sx={{ color: colors.textMuted }}>
              Supports JPG, PNG, WebP (Max 10MB each)
            </Typography>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFileInputChange}
          />
        </Box>
      )}
    </Box>
  );

  // Step 2: Details
  const renderDetailsStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary, fontWeight: 600 }}>
        Tattoo Details
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: colors.textSecondary }}>
        Help others discover your work
      </Typography>

      {/* Title */}
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your tattoo a name"
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            color: colors.textPrimary,
            '& fieldset': { borderColor: colors.border },
            '&:hover fieldset': { borderColor: colors.borderLight },
            '&.Mui-focused fieldset': { borderColor: colors.accent }
          },
          '& .MuiInputLabel-root': { color: colors.textSecondary }
        }}
      />

      {/* Description */}
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Tell the story behind this piece..."
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            color: colors.textPrimary,
            '& fieldset': { borderColor: colors.border },
            '&:hover fieldset': { borderColor: colors.borderLight },
            '&.Mui-focused fieldset': { borderColor: colors.accent }
          },
          '& .MuiInputLabel-root': { color: colors.textSecondary }
        }}
      />

      {/* Styles */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ color: colors.textPrimary, mb: 2, fontWeight: 600 }}>
          Styles
        </Typography>
        {stylesLoading ? (
          <CircularProgress size={24} sx={{ color: colors.accent }} />
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tattooStyles.map((style) => (
              <Box
                key={style.id}
                onClick={() => toggleStyle(style.id)}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: selectedStyles.includes(style.id) ? colors.accent : 'transparent',
                  border: `1px solid ${selectedStyles.includes(style.id) ? colors.accent : colors.border}`,
                  color: selectedStyles.includes(style.id) ? colors.background : colors.textPrimary,
                  '&:hover': {
                    borderColor: colors.accent,
                    bgcolor: selectedStyles.includes(style.id) ? colors.accentHover : 'rgba(201, 169, 98, 0.1)'
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: selectedStyles.includes(style.id) ? 600 : 400 }}>
                  {style.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Tags */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ color: colors.textPrimary, mb: 2, fontWeight: 600 }}>
          Tags
        </Typography>
        <TagsAutocomplete
          value={selectedTags}
          onChange={setSelectedTags}
          label=""
          placeholder="Search and add tags..."
          maxTags={10}
        />
        <Typography variant="caption" sx={{ color: colors.textMuted, mt: 1, display: 'block' }}>
          AI will suggest additional tags after upload
        </Typography>
      </Box>

      {/* Placement, Size, Hours Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: colors.textSecondary }}>Placement</InputLabel>
          <Select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            label="Placement"
            sx={{
              color: colors.textPrimary,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderLight },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: colors.surface,
                  '& .MuiMenuItem-root': {
                    color: colors.textPrimary,
                    '&:hover': { bgcolor: colors.border }
                  }
                }
              }
            }}
          >
            {placementOptions.map((option) => (
              <MenuItem key={option} value={option.toLowerCase()}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ color: colors.textSecondary }}>Size</InputLabel>
          <Select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            label="Size"
            sx={{
              color: colors.textPrimary,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderLight },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: colors.surface,
                  '& .MuiMenuItem-root': {
                    color: colors.textPrimary,
                    '&:hover': { bgcolor: colors.border }
                  }
                }
              }
            }}
          >
            {sizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="number"
          label="Hours to Complete"
          value={hoursToComplete}
          onChange={(e) => setHoursToComplete(e.target.value ? parseInt(e.target.value) : '')}
          inputProps={{ min: 1 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: colors.textPrimary,
              '& fieldset': { borderColor: colors.border },
              '&:hover fieldset': { borderColor: colors.borderLight },
              '&.Mui-focused fieldset': { borderColor: colors.accent }
            },
            '& .MuiInputLabel-root': { color: colors.textSecondary }
          }}
        />
      </Box>
    </Box>
  );

  // Step 3: Review
  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary, fontWeight: 600 }}>
        Review & Publish
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: colors.textSecondary }}>
        Make sure everything looks good
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {/* Preview */}
        <Box>
          {previews.length > 0 && (
            <>
              {/* Primary image large */}
              <img
                src={previews[0]}
                alt="Primary"
                style={{
                  width: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  objectFit: 'contain'
                }}
              />
              {/* Additional images as thumbnails */}
              {previews.length > 1 && (
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 2,
                  overflowX: 'auto',
                  pb: 1
                }}>
                  {previews.slice(1).map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Image ${index + 2}`}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 4,
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  ))}
                </Box>
              )}
              <Typography variant="caption" sx={{ color: colors.textMuted, mt: 1, display: 'block' }}>
                {images.length} image{images.length > 1 ? 's' : ''}
              </Typography>
            </>
          )}
        </Box>

        {/* Details Summary */}
        <Box>
          <Typography variant="h5" sx={{ color: colors.textPrimary, mb: 2 }}>
            {title}
          </Typography>

          {description && (
            <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
              {description}
            </Typography>
          )}

          {/* Styles */}
          {selectedStyles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: colors.textMuted, mb: 1, display: 'block' }}>
                STYLES
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedStyles.map((styleId) => {
                  const style = tattooStyles.find(s => s.id === styleId);
                  return (
                    <Box
                      key={styleId}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: colors.accent,
                        color: colors.background
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {style?.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Subjects */}
          {selectedTags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: colors.textMuted, mb: 1, display: 'block' }}>
                TAGS
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTags.map((tag) => (
                  <Box
                    key={tag.id}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: colors.textSecondary,
                      color: colors.background
                    }}
                  >
                    <Typography variant="caption">
                      {tag.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Details Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 3 }}>
            {placement && (
              <Box>
                <Typography variant="caption" sx={{ color: colors.textMuted }}>
                  PLACEMENT
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textPrimary, textTransform: 'capitalize' }}>
                  {placement}
                </Typography>
              </Box>
            )}
            {size && (
              <Box>
                <Typography variant="caption" sx={{ color: colors.textMuted }}>
                  SIZE
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                  {size}
                </Typography>
              </Box>
            )}
            {hoursToComplete !== '' && (
              <Box>
                <Typography variant="caption" sx={{ color: colors.textMuted }}>
                  TIME
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                  {hoursToComplete} hour{hoursToComplete !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Visibility Toggle */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: colors.surface,
              borderRadius: 2,
              border: `1px solid ${colors.border}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: colors.textPrimary }}>
                  Visibility
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  {isPublic ? 'Anyone can see this tattoo' : 'Only you can see this tattoo'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: isPublic ? colors.textMuted : colors.textPrimary }}>
                  Unlisted
                </Typography>
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.accent
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.accent
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: isPublic ? colors.textPrimary : colors.textMuted }}>
                  Public
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.background,
          color: colors.textPrimary,
          minHeight: '70vh',
          maxHeight: '90vh',
          m: 2,
          width: 'calc(100% - 32px)',
          maxWidth: '600px'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            New Tattoo Post
          </Typography>
          <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Step Indicator */}
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: index <= activeStep ? colors.accent : 'transparent',
                      border: `2px solid ${index <= activeStep ? colors.accent : colors.border}`,
                      color: index <= activeStep ? colors.background : colors.textSecondary,
                      fontWeight: 600,
                      fontSize: 14,
                      flexShrink: 0
                    }}
                  >
                    {index < activeStep ? <CheckIcon sx={{ fontSize: 16 }} /> : index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: index <= activeStep ? colors.textPrimary : colors.textSecondary,
                      fontWeight: index === activeStep ? 600 : 400,
                      display: { xs: index === activeStep ? 'block' : 'none', sm: 'block' }
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
                {index < steps.length - 1 && (
                  <Box sx={{ flex: 1, height: 2, mx: 1, bgcolor: index < activeStep ? colors.accent : colors.border }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mx: 3,
              mt: 2,
              bgcolor: 'transparent',
              border: `1px solid ${colors.error}`,
              color: colors.error
            }}
          >
            {error}
          </Alert>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {renderStepContent()}
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 3,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Button
            onClick={activeStep === 0 ? onClose : handleBack}
            startIcon={activeStep > 0 ? <ArrowBack /> : undefined}
            sx={{
              color: colors.textSecondary,
              '&:hover': { color: colors.textPrimary }
            }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid()}
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted }
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isStepValid() || submitting}
              startIcon={submitting ? <CircularProgress size={20} sx={{ color: colors.background }} /> : <CheckIcon />}
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted }
              }}
            >
              {submitting ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>

    {/* AI Tag Suggestions Modal */}
    <Dialog
      open={showSuggestionsModal}
      onClose={handleCloseSuggestions}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.background,
          border: `1px solid ${colors.border}`,
          color: colors.textPrimary
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AiIcon sx={{ color: colors.accent }} />
        AI Tag Suggestions
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
          Our AI analyzed your tattoo and found these additional tags that might help people discover your work.
          Click to add any that apply.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {aiSuggestions.map((tag) => {
            const isAdded = addedSuggestions.has(tag.id);
            const isAdding = addingTag === tag.id;
            return (
              <Chip
                key={tag.id}
                label={tag.name}
                onClick={() => !isAdded && handleAddSuggestion(tag)}
                icon={
                  isAdding ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : isAdded ? (
                    <CheckIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  bgcolor: isAdded ? colors.accent : 'transparent',
                  color: isAdded ? colors.background : colors.textPrimary,
                  border: `1px solid ${isAdded ? colors.accent : colors.border}`,
                  cursor: isAdded ? 'default' : 'pointer',
                  '&:hover': {
                    bgcolor: isAdded ? colors.accent : 'rgba(201, 169, 98, 0.1)',
                  },
                  '& .MuiChip-icon': {
                    color: isAdded ? colors.background : colors.textSecondary,
                  }
                }}
              />
            );
          })}
        </Box>
        {aiSuggestions.length === 0 && (
          <Typography variant="body2" sx={{ color: colors.textMuted, textAlign: 'center', py: 2 }}>
            No additional suggestions at this time.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCloseSuggestions}
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            '&:hover': { bgcolor: colors.accentHover }
          }}
        >
          {addedSuggestions.size > 0 ? 'Done' : 'Skip'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default TattooCreateWizard;
