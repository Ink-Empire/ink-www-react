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
  Chip,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack,
  ArrowForward,
  Check as CheckIcon,
  AutoAwesome as AiIcon,
  Add as AddIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useStyles } from '../contexts/StyleContext';
import { tattooService } from '../services/tattooService';
import { uploadImagesToS3, UploadProgress } from '../utils/s3Upload';
import { colors, inputStyles } from '@/styles/colors';
import { api } from '../utils/api';
import TagsAutocomplete, { Tag } from './TagsAutocomplete';

interface Placement {
  id: number;
  name: string;
  slug: string;
}

interface TattooCreateWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (tattoo?: any) => void;
}

const steps = ['Upload', 'Details', 'Description', 'Review'];

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

  // Placements from API
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(true);

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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // AI suggestions during upload flow (shown in Details step)
  const [aiSuggestedTags, setAiSuggestedTags] = useState<(Tag & { is_new_suggestion?: boolean })[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [creatingTag, setCreatingTag] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ id: number; url: string }[]>([]);

  // Success snackbar (persists after dialog closes)
  const [successSnackbar, setSuccessSnackbar] = useState(false);

  // AI suggestions modal state (after tattoo creation)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Tag[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
  const [createdTattooId, setCreatedTattooId] = useState<number | null>(null);
  const [createdTattoo, setCreatedTattoo] = useState<any | null>(null);
  const [addingTag, setAddingTag] = useState<number | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Safety: Reset uploaded images if user changes to prevent using another user's images
  const [uploadedByUserId, setUploadedByUserId] = useState<number | null>(null);
  useEffect(() => {
    if (uploadedImages.length > 0 && uploadedByUserId && user?.id && uploadedByUserId !== user.id) {
      console.warn('[TattooCreate] User changed, clearing uploaded images to prevent cross-user image usage');
      setUploadedImages([]);
      setUploadedByUserId(null);
    }
  }, [user?.id, uploadedByUserId, uploadedImages.length]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Fetch placements from API on mount
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Placement[] }>('/placements');
        console.log('Placements API response:', response);
        if (response.data && Array.isArray(response.data)) {
          setPlacements(response.data);
        } else if (Array.isArray(response)) {
          // Handle case where API returns array directly
          setPlacements(response as unknown as Placement[]);
        }
      } catch (err) {
        console.error('Failed to fetch placements:', err);
      } finally {
        setPlacementsLoading(false);
      }
    };
    fetchPlacements();
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
    setAiSuggestedTags([]);
    setLoadingAiSuggestions(false);
    setCreatingTag(null);
    setUploadedImages([]);
    setUploadedByUserId(null);
    setAiSuggestions([]);
    setAddedSuggestions(new Set());
    setCreatedTattooId(null);
    setCreatedTattoo(null);
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

  // Upload images to S3 and fetch AI suggestions
  const uploadImagesAndGetSuggestions = async () => {
    console.log('[AI Tags] Starting uploadImagesAndGetSuggestions, images:', images.length);
    setLoadingAiSuggestions(true);
    setError(null);

    try {
      // Upload images to S3
      console.log('[AI Tags] Starting S3 upload...');
      const uploaded = await uploadImagesToS3(
        images,
        'tattoo',
        (progress) => setUploadProgress(progress)
      );

      console.log('[AI Tags] S3 upload complete, got', uploaded.length, 'images');

      // Store both IDs and URIs for later use, and track which user uploaded them
      setUploadedImages(uploaded.map(img => ({ id: img.id, url: img.uri })));
      setUploadedByUserId(user?.id || null);
      const imageUrls = uploaded.map(img => img.uri);
      console.log('[AI Tags] Image URLs:', imageUrls);

      // Fetch AI suggestions based on uploaded images
      console.log('[AI Tags] Fetching AI tag suggestions...');
      const response = await api.post<{ success: boolean; data: (Tag & { is_new_suggestion?: boolean })[] }>('/tags/suggest', {
        image_urls: imageUrls
      }, { requiresAuth: true });

      console.log('[AI Tags] API response:', response);

      if (response.success && response.data) {
        // Filter out tags that are already selected
        const suggestions = response.data.filter(
          (tag) => !selectedTags.some(selected => selected.id === tag.id)
        );
        console.log('[AI Tags] Setting suggestions:', suggestions);
        setAiSuggestedTags(suggestions);
      } else {
        console.log('[AI Tags] No suggestions in response');
      }
    } catch (error) {
      console.error('[AI Tags] Error:', error);
      // Don't block the flow if AI suggestions fail
    } finally {
      setLoadingAiSuggestions(false);
      setUploadProgress(null);
    }
  };

  // Add an AI-suggested tag to selected tags
  const handleAddAiSuggestion = async (tag: Tag & { is_new_suggestion?: boolean }) => {
    let tagToAdd = tag;

    // If this is a new suggestion (id is null), create it first
    if (tag.id === null || tag.is_new_suggestion) {
      setCreatingTag(tag.name);
      try {
        const response = await api.post<{ success: boolean; data: Tag }>('/tags/create-from-ai', {
          name: tag.name
        }, { requiresAuth: true });

        if (response.success && response.data) {
          tagToAdd = response.data;
        } else {
          console.error('Failed to create AI tag');
          setCreatingTag(null);
          return;
        }
      } catch (error) {
        console.error('Failed to create AI tag:', error);
        setCreatingTag(null);
        return;
      }
      setCreatingTag(null);
    }

    // Add to selected tags with is_ai_suggested flag
    const tagWithFlag = { ...tagToAdd, is_ai_suggested: true };
    setSelectedTags(prev => [...prev, tagWithFlag]);
    // Remove from suggestions (match by name since new tags had null id)
    setAiSuggestedTags(prev => prev.filter(t => t.name !== tag.name));
  };

  const handleNext = async () => {
    if (activeStep === 0 && images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    if (activeStep === 1 && !title.trim()) {
      setError('Please provide a title');
      return;
    }

    setError(null);

    // When moving from Upload to Details, upload images and get AI suggestions
    if (activeStep === 0 && uploadedImages.length === 0) {
      console.log('[AI Tags] Triggering uploadImagesAndGetSuggestions from handleNext');
      // Start the upload and AI suggestion process (runs in background)
      uploadImagesAndGetSuggestions();
    } else {
      console.log('[AI Tags] Skipping upload, activeStep:', activeStep, 'uploadedImages:', uploadedImages.length);
    }

    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setUploadProgress(null);

    // Safety check: verify we have an authenticated user
    if (!user?.id) {
      setError('You must be logged in to create a tattoo');
      setSubmitting(false);
      return;
    }

    console.log('[TattooCreate] Creating tattoo as user:', user.id, user.email);

    try {
      // Images should already be uploaded during the Details step
      // If not, upload them now (fallback)
      let imageIds: number[];

      if (uploadedImages.length > 0) {
        console.log('Using already-uploaded images:', uploadedImages.map(i => i.id));
        imageIds = uploadedImages.map(img => img.id);
      } else {
        // Fallback: upload now if somehow not already uploaded
        console.log('Starting S3 direct upload for', images.length, 'images');
        const uploaded = await uploadImagesToS3(
          images,
          'tattoo',
          (progress) => setUploadProgress(progress)
        );
        console.log('S3 upload complete, got image IDs:', uploaded.map(i => i.id));
        imageIds = uploaded.map(img => img.id);
      }

      // Create the tattoo with the uploaded image IDs
      const tattooData = {
        image_ids: imageIds,
        title: title.trim(),
        description: description.trim() || title.trim(),
        placement,
        size,
        is_public: isPublic ? '1' : '0',
        hours_to_complete: hoursToComplete !== '' && hoursToComplete !== undefined
          ? hoursToComplete.toString()
          : undefined,
        style_ids: selectedStyles.length > 0 ? JSON.stringify(selectedStyles) : undefined,
        primary_style_id: selectedStyles.length > 0 ? selectedStyles[0].toString() : undefined,
        tag_ids: selectedTags.length > 0 ? JSON.stringify(selectedTags.map(t => t.id)) : undefined,
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(tattooData).filter(([_, v]) => v !== undefined)
      );

      const response = await api.post<{
        tattoo: any;
        ai_suggested_tags: Tag[];
        ai_tags_pending?: boolean;
      }>('/tattoos/create', cleanData, {
        requiresAuth: true
      });

      console.log('Tattoo created:', response);

      // AI tags are now generated in the background
      // The response includes ai_tags_pending: true to indicate this
      const newTattoo = response.tattoo;
      setCreatedTattooId(newTattoo?.id || null);
      setCreatedTattoo(newTattoo);

      // Check if we have any AI suggestions already (usually empty now)
      const suggestions = response.ai_suggested_tags || [];
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setAddedSuggestions(new Set());
        setShowSuggestionsModal(true);
      } else {
        // No immediate suggestions - AI is processing in background
        setSuccessSnackbar(true);
        if (onSuccess) {
          onSuccess(newTattoo);
        }
        onClose();
      }

    } catch (error) {
      console.error('Failed to create tattoo:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tattoo post');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  // Add an AI-suggested tag to the tattoo
  const handleAddSuggestion = async (tag: Tag) => {
    if (!createdTattooId || addedSuggestions.has(tag.id)) return;

    setAddingTag(tag.id);
    try {
      await tattooService.addTagById(createdTattooId, tag.id);

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
    setSuccessSnackbar(true);
    if (onSuccess) {
      onSuccess(createdTattoo);
    }
    onClose();
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0: // Upload
        return images.length > 0;
      case 1: // Details - only require title
        return title.trim() !== '';
      case 2: // Additional - all optional
        return true;
      case 3: // Review
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

  // Step 2: Basic Details (Title, Description, Styles)
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
        sx={{ mb: 3, ...inputStyles.textField }}
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
        sx={{ mb: 4, ...inputStyles.textField }}
      />

      {/* Styles */}
      <Box>
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
    </Box>
  );

  // Step 3: Description (Tags, Placement, Size, Hours)
  const renderAdditionalStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary, fontWeight: 600 }}>
        Description
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: colors.textSecondary }}>
        Add more information to help categorize your work
      </Typography>

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

        {/* AI Tag Suggestions */}
        {(loadingAiSuggestions || aiSuggestedTags.length > 0) && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <AiIcon sx={{ fontSize: 18, color: colors.aiSuggestion }} />
              <Typography variant="caption" sx={{ color: colors.aiSuggestion, fontWeight: 600 }}>
                AI SUGGESTIONS
              </Typography>
              {loadingAiSuggestions && (
                <CircularProgress size={14} sx={{ color: colors.aiSuggestion, ml: 1 }} />
              )}
            </Box>
            {aiSuggestedTags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {aiSuggestedTags.map((tag) => {
                  const isNew = tag.id === null || tag.is_new_suggestion;
                  const isCreating = creatingTag === tag.name;
                  return (
                    <Box
                      key={tag.name}
                      onClick={() => !isCreating && handleAddAiSuggestion(tag)}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        cursor: isCreating ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'transparent',
                        border: `1px ${isNew ? 'dashed' : 'solid'} ${colors.aiSuggestion}`,
                        color: colors.aiSuggestion,
                        opacity: isCreating ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isCreating ? 'transparent' : `${colors.aiSuggestion}20`,
                        }
                      }}
                    >
                      {isCreating ? (
                        <CircularProgress size={14} sx={{ color: colors.aiSuggestion }} />
                      ) : (
                        <AddIcon sx={{ fontSize: 14 }} />
                      )}
                      <Typography variant="caption">
                        {tag.name}
                      </Typography>
                      {isNew && !isCreating && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.7 }}>
                          NEW
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : loadingAiSuggestions ? (
              <Typography variant="caption" sx={{ color: colors.textMuted, fontStyle: 'italic' }}>
                Analyzing your images...
              </Typography>
            ) : null}
          </Box>
        )}

        {!loadingAiSuggestions && aiSuggestedTags.length === 0 && uploadedImages.length === 0 && (
          <Typography variant="caption" sx={{ color: colors.textMuted, mt: 1, display: 'block' }}>
            AI will suggest tags based on your images
          </Typography>
        )}
      </Box>

      {/* Placement, Size, Hours Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel sx={inputStyles.inputLabel}>Placement</InputLabel>
          <Select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            label="Placement"
            sx={inputStyles.select}
            MenuProps={inputStyles.selectMenuProps}
            disabled={placementsLoading}
          >
            {placementsLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              placements.map((p) => (
                <MenuItem key={p.id} value={p.name}>
                  {p.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={inputStyles.inputLabel}>Size</InputLabel>
          <Select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            label="Size"
            sx={inputStyles.select}
            MenuProps={inputStyles.selectMenuProps}
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
          sx={inputStyles.textField}
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

          {/* Tags */}
          {selectedTags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: colors.textMuted, mb: 1, display: 'block' }}>
                TAGS
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTags.map((tag) => {
                  const isPending = tag.is_pending === true;
                  const isAiSuggested = (tag as Tag & { is_ai_suggested?: boolean }).is_ai_suggested === true;
                  return (
                    <Box
                      key={tag.id}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: isPending ? 'transparent' : isAiSuggested ? 'transparent' : colors.textSecondary,
                        color: isPending ? colors.accent : isAiSuggested ? colors.aiSuggestion : colors.background,
                        border: isPending
                          ? `1px dashed ${colors.accent}`
                          : isAiSuggested
                            ? `1px solid ${colors.aiSuggestion}`
                            : 'none',
                      }}
                    >
                      {isAiSuggested ? <AiIcon sx={{ fontSize: 14 }} /> : <TagIcon sx={{ fontSize: 14 }} />}
                      <Typography variant="caption">
                        {tag.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {(selectedTags.some(t => t.is_pending) || selectedTags.some(t => (t as Tag & { is_ai_suggested?: boolean }).is_ai_suggested)) && (
                <Typography sx={{ mt: 1, fontSize: '0.7rem', color: colors.textMuted, fontStyle: 'italic' }}>
                  {selectedTags.some(t => t.is_pending) && 'Tags with dotted borders are pending approval. '}
                  {selectedTags.some(t => (t as Tag & { is_ai_suggested?: boolean }).is_ai_suggested) && 'Blue tags were suggested by AI.'}
                </Typography>
              )}
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
        return renderAdditionalStep();
      case 3:
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
              {submitting
                ? (uploadProgress?.status === 'uploading'
                    ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}...`
                    : uploadProgress?.status === 'confirming'
                      ? 'Saving...'
                      : 'Publishing...')
                : 'Publish'}
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

    <Snackbar
      open={successSnackbar}
      autoHideDuration={5000}
      onClose={() => setSuccessSnackbar(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setSuccessSnackbar(false)}
        severity="success"
        sx={{
          bgcolor: colors.success,
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
        }}
      >
        Tattoo published! It will appear in search shortly.
      </Alert>
    </Snackbar>
    </>
  );
};

export default TattooCreateWizard;
