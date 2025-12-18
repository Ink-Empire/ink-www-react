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
  OutlinedInput
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { useRouter } from 'next/router';
import { colors } from '@/styles/colors';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // UI state
  const [styles, setStyles] = useState<Style[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const response = await api.get('/styles');
      setStyles(response.data || []);
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

    try {
      // Create FormData for the tattoo
      const formData = new FormData();
      
      // Add images as 'files' array (matching existing API)
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      // Add form fields
      formData.append('description', description.trim());
      formData.append('primary_style_id', primaryStyleId.toString());
      
      // Add additional styles as a JSON array for now
      if (additionalStyleIds.length > 0) {
        formData.append('additional_style_ids', JSON.stringify(additionalStyleIds));
      }

      // Submit to existing API endpoint
      const response = await api.post('/tattoos/create', formData, {
        requiresAuth: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setError(null);
      
      // Reset form
      setDescription('');
      setPrimaryStyleId('');
      setAdditionalStyleIds([]);
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Success - no redirect needed since we're using modals now

    } catch (error) {
      console.error('Failed to create tattoo:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tattoo post');
    } finally {
      setSubmitting(false);
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
    </Card>
  );
};

export default TattooCreateForm;