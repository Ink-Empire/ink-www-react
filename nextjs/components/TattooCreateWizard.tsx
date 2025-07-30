import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  IconButton
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  ArrowBack,
  ArrowForward,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useStyles } from '../contexts/StyleContext';
import { api } from '../utils/api';
import { useRouter } from 'next/router';

interface Style {
  id: number;
  name: string;
}

interface TattooCreateWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['Upload Images', 'Details & Placement', 'Styles'];

const TattooCreateWizard: React.FC<TattooCreateWizardProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { styles, loading: stylesLoading } = useStyles();
  const router = useRouter();
  
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form data
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [primaryStyleId, setPrimaryStyleId] = useState<number | null>(null);
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placementOptions = [
    'Arm', 'Leg', 'Back', 'Chest', 'Shoulder', 'Forearm', 'Wrist', 
    'Ankle', 'Neck', 'Hand', 'Foot', 'Ribs', 'Stomach', 'Thigh', 'Other'
  ];

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setActiveStep(0);
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setDescription('');
    setPlacement('');
    setSelectedStyles([]);
    setPrimaryStyleId(null);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    if (selectedFiles.length + files.length > 5) {
      setError('You can only upload up to 5 images');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
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

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }
    if (activeStep === 1 && !description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (activeStep === 2 && primaryStyleId === '') {
      setError('Please select a primary style');
      return;
    }

    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Style selection functions
  const toggleStyle = (styleId: number) => {
    if (selectedStyles.includes(styleId)) {
      setSelectedStyles(selectedStyles.filter(id => id !== styleId));
      // If removing the primary style, clear primary designation
      if (primaryStyleId === styleId) {
        setPrimaryStyleId(null);
      }
    } else {
      setSelectedStyles([...selectedStyles, styleId]);
      // If this is the first style selected, make it primary
      if (selectedStyles.length === 0) {
        setPrimaryStyleId(styleId);
      }
    }
  };

  const setPrimary = (styleId: number) => {
    setPrimaryStyleId(styleId);
  };

  const isStyleSelected = (styleId: number) => {
    return selectedStyles.includes(styleId);
  };

  const isPrimary = (styleId: number) => {
    return primaryStyleId === styleId;
  };

  const toggleSelectAll = () => {
    if (selectedStyles.length > 0) {
      setSelectedStyles([]);
      setPrimaryStyleId(null);
    } else {
      const allStyleIds = styles.map(style => style.id);
      setSelectedStyles(allStyleIds);
      // Set first style as primary when selecting all
      if (allStyleIds.length > 0) {
        setPrimaryStyleId(allStyleIds[0]);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add images
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      // Add form fields
      formData.append('description', description.trim());
      formData.append('placement', placement);
      
      // Add primary style
      if (primaryStyleId) {
        formData.append('primary_style_id', primaryStyleId.toString());
      }
      
      // Add styles - send as JSON array
      if (selectedStyles.length > 0) {
        formData.append('style_ids', JSON.stringify(selectedStyles));
      }

      // Submit to API (don't set Content-Type header - let browser set it for FormData)
      const response = await api.post('/tattoos/create', formData, {
        requiresAuth: true
      });

      // Success - close modal and redirect
      onClose();
      
      if (response.data?.id) {
        router.push(`/tattoos/${response.data.id}`);
      }

    } catch (error) {
      console.error('Failed to create tattoo:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tattoo post');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>Upload Your Tattoo Images</Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Select up to 5 high-quality images of your tattoo work
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              disabled={selectedFiles.length >= 5}
              fullWidth
              sx={{ 
                mb: 2,
                color: '#000000',
                borderColor: '#000000',
                '&:hover': {
                  borderColor: '#000000',
                  color: '#000000'
                }
              }}
            >
              {selectedFiles.length >= 5 ? 'Maximum 5 Images' : 'Choose Images'}
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {previewUrls.length > 0 && (
              <ImageList cols={3} rowHeight={120} gap={8}>
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
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>Tattoo Details</Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiInputBase-input': {
                  color: 'text.primary'
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary'
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'grey.300'
                  },
                  '&:hover fieldset': {
                    borderColor: 'grey.400'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main'
                  }
                }
              }}
              placeholder="Describe your tattoo work, inspiration, technique used, etc."
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.primary' }}>Placement</InputLabel>
              <Select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                label="Placement"
                sx={{
                  '& .MuiSelect-select': {
                    color: 'text.primary',
                    backgroundColor: 'transparent'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.300'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.400'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                {placementOptions.map((option) => (
                  <MenuItem 
                    key={option} 
                    value={option.toLowerCase()}
                    sx={{ 
                      color: 'text.primary',
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>Select Tattoo Styles</Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Choose one or more styles that describe this tattoo work
            </Typography>
            
            {stylesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ 
                maxHeight: 300, 
                overflow: 'auto',
                border: '2px solid white',
                borderRadius: 2,
                boxShadow: 2
              }}>
                {/* Select All option */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '2px solid white',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStyles.length > 0 ? 'Deselect All' : 'Select All'}
                    </Typography>
                    <input
                      type="checkbox"
                      checked={selectedStyles.length > 0 && selectedStyles.length === styles.length}
                      onChange={toggleSelectAll}
                      style={{ 
                        width: '18px', 
                        height: '18px',
                        accentColor: '#1976d2'
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Style options */}
                {styles.map((style) => (
                  <Box 
                    key={style.id} 
                    sx={{ 
                      p: 2, 
                      borderBottom: '1px solid #000000',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isStyleSelected(style.id)}
                          onChange={() => toggleStyle(style.id)}
                          style={{ 
                            width: '18px', 
                            height: '18px',
                            accentColor: '#000000'
                          }}
                        />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: isStyleSelected(style.id) ? 600 : 400,
                            flex: 1,
                            color: 'text.primary'
                          }}
                        >
                          {style.name}
                          {isPrimary(style.id) && (
                            <Typography 
                              component="span" 
                              variant="caption" 
                              sx={{ 
                                ml: 1, 
                                color: 'primary.main', 
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            >
                              (PRIMARY)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      
                      {isStyleSelected(style.id) && !isPrimary(style.id) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setPrimary(style.id)}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            fontSize: '0.7rem'
                          }}
                        >
                          Set Primary
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return selectedFiles.length > 0;
      case 1:
        return description.trim() !== '' && placement !== '';
      case 2:
        return selectedStyles.length > 0;
      default:
        return false;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          bgcolor: 'warmBeige.main',
          color: '#000000',
          '& .MuiTypography-root': {
            color: '#000000'
          },
          '& .MuiFormLabel-root': {
            color: '#000000'
          },
          '& .MuiInputLabel-root': {
            color: '#000000'
          },
          '& .MuiStepLabel-label': {
            color: '#000000'
          },
          '& .MuiStepper-root .MuiStepLabel-root .MuiStepLabel-label': {
            color: '#000000'
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#000000'
            },
            '&:hover fieldset': {
              borderColor: '#000000'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000'
            }
          },
          '& .MuiTextField-root .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#000000'
            },
            '&:hover fieldset': {
              borderColor: '#000000'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000'
            }
          },
          '& .MuiSelect-root': {
            '& fieldset': {
              borderColor: '#000000'
            },
            '&:hover fieldset': {
              borderColor: '#000000'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000'
            }
          },
          '& .MuiFormControl-root .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#000000'
            },
            '&:hover fieldset': {
              borderColor: '#000000'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000'
            }
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#000000',
            opacity: 0.7
          },
          '& .MuiInputBase-input': {
            color: '#000000'
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: '#000000',
            opacity: 0.7
          },
          '& .MuiTextField-root input::placeholder': {
            color: '#000000',
            opacity: 0.7
          },
          '& .MuiCheckbox-root': {
            color: '#000000'
          },
          '& .MuiFormControlLabel-root': {
            color: '#000000'
          },
          '& .MuiChip-root': {
            borderColor: '#000000',
            color: '#000000'
          },
          '& .MuiChip-outlined': {
            borderColor: '#000000',
            color: '#000000'
          }
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Create New Tattoo Post</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: '300px', mb: 3 }}>
          {renderStepContent()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={activeStep === 0 ? onClose : handleBack}
            startIcon={activeStep === 0 ? undefined : <ArrowBack />}
            sx={{ 
              color: '#000000',
              '&:hover': {
                color: '#000000'
              }
            }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid()}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!isStepValid() || submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TattooCreateWizard;