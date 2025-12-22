import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  ImageList,
  ImageListItem,
  SelectChangeEvent,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Add as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { useRouter } from 'next/router';
import { colors } from '@/styles/colors';
import TagsAutocomplete, { Tag } from './TagsAutocomplete';

interface Style {
  id: number;
  name: string;
}

interface TattooCreateFormProps {
  onSuccess?: () => void;
}

const TattooCreateForm: React.FC<TattooCreateFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [description, setDescription] = useState('');
  const [primaryStyleId, setPrimaryStyleId] = useState<number | ''>('');
  const [additionalStyleIds, setAdditionalStyleIds] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // UI state
  const [styles, setStyles] = useState<Style[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI suggestions modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Tag[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
  const [createdTattooId, setCreatedTattooId] = useState<number | null>(null);
  const [addingTag, setAddingTag] = useState<number | null>(null);

  // Load styles on component mount
  useEffect(() => {
    loadStyles();
    
    // Cleanup preview URLs on unmount
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadStyles = async () => {
    try {
      setLoadingStyles(true);
      const response = await api.get<any>('/styles');
      // API returns { styles: [...] }
      const stylesData = response.styles || response.data || response || [];
      setStyles(Array.isArray(stylesData) ? stylesData : []);
    } catch (error) {
      console.error('Failed to load styles:', error);
      setError('Failed to load tattoo styles');
    } finally {
      setLoadingStyles(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Check total file count (existing + new)
    if (selectedFiles.length + files.length > 5) {
      setError('You can only upload up to 5 images');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Images must be smaller than 5MB');
        return;
      }
      
      newFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setError(null);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdditionalStylesChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    const selectedIds = typeof value === 'string' ? [] : value as number[];
    
    // Remove primary style from additional styles if it was selected
    const filteredIds = selectedIds.filter(id => id !== primaryStyleId);
    setAdditionalStyleIds(filteredIds);
  };

  const handlePrimaryStyleChange = (event: SelectChangeEvent<number | ''>) => {
    const value = event.target.value as number | '';
    setPrimaryStyleId(value);
    
    // Remove the new primary style from additional styles if it exists there
    if (value !== '' && additionalStyleIds.includes(value)) {
      setAdditionalStyleIds(prev => prev.filter(id => id !== value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user?.id) {
      setError('You must be logged in to create a tattoo post');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (primaryStyleId === '') {
      setError('Please select a primary style');
      return;
    }

    setSubmitting(true);
    setError(null);

    console.log('Starting tattoo upload...', {
      filesCount: selectedFiles.length,
      description: description.substring(0, 50),
      primaryStyleId,
      tagsCount: selectedTags.length
    });

    try {
      // Create FormData for the tattoo
      const formData = new FormData();
      
      // Add images as 'files[]' array (Laravel expects bracket notation for arrays)
      selectedFiles.forEach((file) => {
        formData.append('files[]', file);
      });
      
      // Add form fields
      formData.append('description', description.trim());
      formData.append('primary_style_id', primaryStyleId.toString());
      
      // Add additional styles as a JSON array for now
      if (additionalStyleIds.length > 0) {
        formData.append('additional_style_ids', JSON.stringify(additionalStyleIds));
      }

      // Add selected tags
      // Note: AI will also suggest additional tags after upload (see TagsAutocomplete comments)
      if (selectedTags.length > 0) {
        formData.append('tag_ids', JSON.stringify(selectedTags.map(t => t.id)));
      }

      // Submit to existing API endpoint
      // Note: Do NOT set Content-Type header - browser must set it automatically with boundary
      const response = await api.post<{
        tattoo: any;
        ai_suggested_tags: Tag[];
      }>('/tattoos/create', formData, {
        requiresAuth: true
      });

      console.log('Tattoo upload response:', response);

      setSuccess(true);
      setError(null);

      // Reset form
      setDescription('');
      setPrimaryStyleId('');
      setAdditionalStyleIds([]);
      setSelectedTags([]);
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);

      // Check if we have AI suggestions to show
      const suggestions = response.ai_suggested_tags || [];
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setCreatedTattooId(response.tattoo?.id || null);
        setAddedSuggestions(new Set());
        setShowSuggestionsModal(true);
      } else {
        // No suggestions, just call success callback
        if (onSuccess) {
          onSuccess();
        }
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
    setAiSuggestions([]);
    setCreatedTattooId(null);
    setAddedSuggestions(new Set());
    if (onSuccess) {
      onSuccess();
    }
  };

  // Don't render if not an artist or not logged in
  if (!user?.id) {
    return null;
  }

  return (
    <Card sx={{ mt: 3, bgcolor: colors.surface, border: '1px solid #444' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Create New Tattoo Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: colors.surface, border: `1px solid ${colors.error}` }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: colors.surface, border: '1px solid #4caf50' }}>
            Tattoo post created successfully! Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
              Images (up to 5)
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              disabled={selectedFiles.length >= 5 || submitting}
              sx={{
                color: colors.accent,
                borderColor: colors.accent,
                '&:hover': {
                  borderColor: colors.accentDark,
                  bgcolor: 'rgba(51, 153, 137, 0.1)'
                }
              }}
            >
              {selectedFiles.length >= 5 ? 'Max 5 Images' : 'Add Images'}
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {previewUrls.length > 0 && (
              <ImageList 
                sx={{ mt: 2, maxHeight: 200 }} 
                cols={3} 
                rowHeight={100}
                gap={8}
              >
                {previewUrls.map((url, index) => (
                  <ImageListItem key={index} sx={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.8)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: colors.accent },
                '&.Mui-focused fieldset': { borderColor: colors.accent }
              },
              '& .MuiInputLabel-root': { color: '#888' }
            }}
          />

          {/* Primary Style */}
          <FormControl
            fullWidth
            sx={{ mb: 3 }}
            disabled={submitting || loadingStyles}
          >
            <InputLabel sx={{ color: '#888' }}>Primary Style</InputLabel>
            <Select
              value={primaryStyleId}
              onChange={handlePrimaryStyleChange}
              label="Primary Style"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent }
              }}
            >
              {styles.map((style) => (
                <MenuItem key={style.id} value={style.id}>
                  {style.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Additional Styles */}
          <FormControl
            fullWidth
            sx={{ mb: 3 }}
            disabled={submitting || loadingStyles}
          >
            <InputLabel sx={{ color: '#888' }}>Additional Styles (Optional)</InputLabel>
            <Select
              multiple
              value={additionalStyleIds}
              onChange={handleAdditionalStylesChange}
              input={<OutlinedInput label="Additional Styles (Optional)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as number[]).map((value) => {
                    const style = styles.find(s => s.id === value);
                    return (
                      <Chip
                        key={value}
                        label={style?.name}
                        size="small"
                        sx={{ bgcolor: colors.accent, color: 'white' }}
                      />
                    );
                  })}
                </Box>
              )}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent }
              }}
            >
              {styles
                .filter(style => style.id !== primaryStyleId)
                .map((style) => (
                  <MenuItem key={style.id} value={style.id}>
                    {style.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Tags */}
          {/*
           * IMPLEMENTED: AI-suggested tags shown in post-creation modal
           *
           * TODO: Future enhancement for custom tags:
           * Allow users to type tags that don't exist in our database.
           * These should be marked as "pending" until approved by an admin.
           * Add a `status` field to tags table (approved, pending, rejected).
           */}
          <Box sx={{ mb: 3 }}>
            <TagsAutocomplete
              value={selectedTags}
              onChange={setSelectedTags}
              label="Tags (Optional)"
              placeholder="Search and add tags..."
              disabled={submitting}
              maxTags={10}
            />
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting || selectedFiles.length === 0 || !description.trim() || primaryStyleId === ''}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              bgcolor: colors.accent,
              '&:hover': { bgcolor: colors.accentDark },
              '&:disabled': { bgcolor: '#555', color: '#888' }
            }}
          >
            {submitting ? 'Creating Post...' : 'Create Tattoo Post'}
          </Button>
        </Box>
      </CardContent>

      {/* AI Tag Suggestions Modal */}
      <Dialog
        open={showSuggestionsModal}
        onClose={handleCloseSuggestions}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: '1px solid #444',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AiIcon sx={{ color: colors.accent }} />
          AI Tag Suggestions
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
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
                    color: 'white',
                    border: `1px solid ${isAdded ? colors.accent : '#666'}`,
                    cursor: isAdded ? 'default' : 'pointer',
                    '&:hover': {
                      bgcolor: isAdded ? colors.accent : 'rgba(51, 153, 137, 0.2)',
                    },
                    '& .MuiChip-icon': {
                      color: 'white',
                    }
                  }}
                />
              );
            })}
          </Box>
          {aiSuggestions.length === 0 && (
            <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', py: 2 }}>
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
              '&:hover': { bgcolor: colors.accentDark }
            }}
          >
            {addedSuggestions.size > 0 ? 'Done' : 'Skip'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TattooCreateForm;