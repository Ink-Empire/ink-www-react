import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent, IconButton,
  TextField, Avatar, CircularProgress, Snackbar, Alert,
  useMediaQuery, useTheme, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors, inputStyles } from '@/styles/colors';
import { uploadImagesToS3, UploadedImage, UploadProgress } from '@/utils/s3Upload';
import { messageService } from '@/services/messageService';
import { tattooService } from '@/services/tattooService';

interface ClientUploadWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ArtistResult {
  id: number;
  name: string;
  username: string;
  image?: { uri: string };
}

const STEPS = ['Images', 'Details', 'Review'];
const MAX_IMAGES = 5;

export default function ClientUploadWizard({ open, onClose, onSuccess }: ClientUploadWizardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Step state
  const [step, setStep] = useState(0);

  // Step 0: Images
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Step 1: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistResult | null>(null);
  const [searchingArtists, setSearchingArtists] = useState(false);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Reset all state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setFiles([]);
      setPreviews([]);
      setUploadedImages([]);
      setUploadProgress(null);
      setIsUploading(false);
      setTitle('');
      setDescription('');
      setArtistQuery('');
      setArtistResults([]);
      setSelectedArtist(null);
      setIsPublishing(false);
      setErrorMessage('');
    }
  }, [open]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Debounced artist search
  useEffect(() => {
    if (artistQuery.length < 2 || selectedArtist) {
      setArtistResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingArtists(true);
      try {
        const response = await messageService.searchUsers(artistQuery);
        setArtistResults(response.users || []);
      } catch {
        setArtistResults([]);
      } finally {
        setSearchingArtists(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [artistQuery, selectedArtist]);

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - files.length;
    const toAdd = imageFiles.slice(0, remaining);
    if (toAdd.length === 0) return;

    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files.length]);

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // Clear uploaded images since they no longer match
    setUploadedImages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Advance from step 0 to step 1 - start uploading in background
  const handleNextFromImages = async () => {
    setStep(1);
    if (uploadedImages.length === 0 && files.length > 0) {
      setIsUploading(true);
      try {
        const images = await uploadImagesToS3(files, 'tattoo', setUploadProgress);
        setUploadedImages(images);
      } catch (err) {
        console.error('Upload failed:', err);
        setErrorMessage('Image upload failed. Please try again.');
        setStep(0);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage('');

    try {
      // If images aren't uploaded yet, wait for them
      let imageIds = uploadedImages.map(img => img.id);
      if (imageIds.length === 0) {
        const images = await uploadImagesToS3(files, 'tattoo', setUploadProgress);
        imageIds = images.map(img => img.id);
        setUploadedImages(images);
      }

      const payload: {
        image_ids: number[];
        title?: string;
        description?: string;
        tagged_artist_id?: number;
      } = {
        image_ids: imageIds,
      };

      if (title.trim()) payload.title = title.trim();
      if (description.trim()) payload.description = description.trim();
      if (selectedArtist) payload.tagged_artist_id = selectedArtist.id;

      await tattooService.clientUpload(payload);

      setSuccessSnackbar(true);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Publish failed:', err);
      setErrorMessage(err.message || 'Failed to publish tattoo. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const selectArtist = (artist: ArtistResult) => {
    setSelectedArtist(artist);
    setArtistQuery('');
    setArtistResults([]);
  };

  const clearArtist = () => {
    setSelectedArtist(null);
    setArtistQuery('');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={isPublishing ? undefined : onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            backgroundImage: 'none',
            borderRadius: isMobile ? 0 : '16px',
            maxHeight: isMobile ? '100%' : '90vh',
            border: `1px solid ${colors.accent}50`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accent}30`,
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {step > 0 && !isPublishing && (
              <IconButton
                onClick={() => setStep(step - 1)}
                sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
              Upload Tattoo
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isPublishing}
            sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Step Indicator */}
        <Box sx={{
          display: 'flex',
          gap: 0.5,
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          {STEPS.map((label, i) => (
            <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
              <Box sx={{
                height: 3,
                borderRadius: 2,
                bgcolor: i <= step ? colors.accent : colors.border,
                transition: 'background-color 0.3s',
                mb: 0.5,
              }} />
              <Typography sx={{
                fontSize: '0.7rem',
                color: i <= step ? colors.accent : colors.textMuted,
                fontWeight: i === step ? 600 : 400,
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Loading overlay */}
        {(isPublishing || (isUploading && step === 0)) && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.7)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            <CircularProgress sx={{ color: colors.accent }} />
            <Typography sx={{ color: colors.textPrimary, fontSize: '0.9rem' }}>
              {isPublishing ? 'Publishing your tattoo...' : uploadProgress?.current || 'Uploading images...'}
            </Typography>
            {uploadProgress && uploadProgress.status === 'uploading' && (
              <LinearProgress
                variant="determinate"
                value={(uploadProgress.completed / uploadProgress.total) * 100}
                sx={{
                  width: '60%',
                  bgcolor: colors.border,
                  '& .MuiLinearProgress-bar': { bgcolor: colors.accent },
                }}
              />
            )}
          </Box>
        )}

        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {/* Step 0: Images */}
          {step === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 2 }}>
                Add up to {MAX_IMAGES} photos of your tattoo. The first image will be the primary photo.
              </Typography>

              {/* Drop zone */}
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => files.length < MAX_IMAGES && fileInputRef.current?.click()}
                sx={{
                  border: `2px dashed ${isDragging ? colors.accent : colors.border}`,
                  borderRadius: '12px',
                  p: 4,
                  textAlign: 'center',
                  cursor: files.length < MAX_IMAGES ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  bgcolor: isDragging ? `${colors.accent}10` : 'transparent',
                  '&:hover': files.length < MAX_IMAGES ? {
                    borderColor: colors.accent,
                    bgcolor: `${colors.accent}08`,
                  } : {},
                  mb: 2,
                }}
              >
                <AddAPhotoIcon sx={{ fontSize: 40, color: colors.textMuted, mb: 1 }} />
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                  {files.length < MAX_IMAGES
                    ? 'Drag photos here or click to browse'
                    : `Maximum ${MAX_IMAGES} images reached`}
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>

              {/* Thumbnails */}
              {previews.length > 0 && (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: 1.5,
                }}>
                  {previews.map((preview, index) => (
                    <Box key={preview} sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        sx={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: index === 0
                            ? `2px solid ${colors.accent}`
                            : `1px solid ${colors.border}`,
                        }}
                      />
                      {index === 0 && (
                        <Box sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Primary
                        </Box>
                      )}
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          p: 0.5,
                          '&:hover': { bgcolor: colors.error },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Next button */}
              <Button
                onClick={handleNextFromImages}
                disabled={files.length === 0}
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.25,
                  bgcolor: files.length > 0 ? colors.accent : colors.border,
                  color: files.length > 0 ? colors.background : colors.textMuted,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: files.length > 0 ? colors.accentHover : colors.border },
                  '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                }}
              >
                Next
              </Button>
            </Box>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 0.75 }}>
                  Title (optional)
                </Typography>
                <TextField
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name your tattoo"
                  fullWidth
                  size="small"
                  sx={inputStyles.textField}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 0.75 }}>
                  Description (optional)
                </Typography>
                <TextField
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the story behind this tattoo"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  sx={inputStyles.textField}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 0.75 }}>
                  Tag Artist (optional)
                </Typography>

                {selectedArtist ? (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: colors.background,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: '8px',
                  }}>
                    <Avatar
                      src={selectedArtist.image?.uri}
                      sx={{ width: 36, height: 36, bgcolor: colors.accent, color: colors.background, fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {(selectedArtist.name || selectedArtist.username).slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                        {selectedArtist.name || selectedArtist.username}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                        @{selectedArtist.username}
                      </Typography>
                    </Box>
                    <IconButton onClick={clearArtist} size="small" sx={{ color: colors.textMuted, '&:hover': { color: colors.error } }}>
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      value={artistQuery}
                      onChange={(e) => setArtistQuery(e.target.value)}
                      placeholder="Search for the artist who did this tattoo"
                      fullWidth
                      size="small"
                      sx={inputStyles.textField}
                      InputProps={{
                        endAdornment: searchingArtists ? (
                          <CircularProgress size={18} sx={{ color: colors.accent }} />
                        ) : null,
                      }}
                    />
                    {/* Artist search results dropdown */}
                    {artistResults.length > 0 && (
                      <Box sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 0.5,
                        bgcolor: colors.surfaceElevated,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        zIndex: 20,
                        maxHeight: 200,
                        overflow: 'auto',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      }}>
                        {artistResults.map((artist) => (
                          <Box
                            key={artist.id}
                            onClick={() => selectArtist(artist)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              '&:hover': { bgcolor: colors.surfaceHover },
                              '&:not(:last-child)': { borderBottom: `1px solid ${colors.border}` },
                            }}
                          >
                            <Avatar
                              src={artist.image?.uri}
                              sx={{ width: 32, height: 32, bgcolor: colors.accent, color: colors.background, fontSize: '0.7rem', fontWeight: 600 }}
                            >
                              {(artist.name || artist.username).slice(0, 2).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary }}>
                                {artist.name || artist.username}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                @{artist.username}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {selectedArtist && (
                  <Typography sx={{ fontSize: '0.75rem', color: colors.info, mt: 1, lineHeight: 1.4 }}>
                    The artist will be notified and must approve before this appears in the main feed.
                  </Typography>
                )}
              </Box>

              {/* Upload progress indicator */}
              {isUploading && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  bgcolor: `${colors.accent}10`,
                  borderRadius: '8px',
                }}>
                  <CircularProgress size={20} sx={{ color: colors.accent }} />
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                    {uploadProgress?.current || 'Uploading images...'}
                  </Typography>
                </Box>
              )}
              {!isUploading && uploadedImages.length > 0 && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  bgcolor: `${colors.success}15`,
                  borderRadius: '8px',
                }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: colors.success }} />
                  <Typography sx={{ fontSize: '0.8rem', color: colors.success }}>
                    {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} uploaded
                  </Typography>
                </Box>
              )}

              <Button
                onClick={() => setStep(2)}
                fullWidth
                sx={{
                  mt: 1,
                  py: 1.25,
                  bgcolor: colors.accent,
                  color: colors.background,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: colors.accentHover },
                }}
              >
                Next
              </Button>
            </Box>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Primary image */}
              {previews.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="img"
                    src={previews[0]}
                    alt="Primary tattoo photo"
                    sx={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                  {/* Additional thumbnails */}
                  {previews.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {previews.slice(1).map((preview, i) => (
                        <Box
                          key={preview}
                          component="img"
                          src={preview}
                          alt={`Tattoo photo ${i + 2}`}
                          sx={{
                            width: 56,
                            height: 56,
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Details summary */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                {title.trim() && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.25 }}>Title</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: 500 }}>{title.trim()}</Typography>
                  </Box>
                )}
                {description.trim() && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.25 }}>Description</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>{description.trim()}</Typography>
                  </Box>
                )}
                {selectedArtist && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.5 }}>Tagged Artist</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={selectedArtist.image?.uri}
                        sx={{ width: 28, height: 28, bgcolor: colors.accent, color: colors.background, fontSize: '0.7rem', fontWeight: 600 }}
                      >
                        {(selectedArtist.name || selectedArtist.username).slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: 500 }}>
                        {selectedArtist.name || selectedArtist.username}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                        @{selectedArtist.username}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Visibility info */}
              <Box sx={{
                p: 1.5,
                bgcolor: `${colors.info}12`,
                border: `1px solid ${colors.info}30`,
                borderRadius: '8px',
                mb: 3,
              }}>
                <Typography sx={{ fontSize: '0.8rem', color: colors.info, lineHeight: 1.5 }}>
                  {selectedArtist
                    ? 'This tattoo will appear on your profile immediately and in the main feed after the artist approves.'
                    : 'This tattoo will be visible on your profile page.'}
                </Typography>
              </Box>

              {/* Error */}
              {errorMessage && (
                <Typography sx={{ fontSize: '0.8rem', color: colors.error, mb: 2, textAlign: 'center' }}>
                  {errorMessage}
                </Typography>
              )}

              {/* Share button */}
              <Button
                onClick={handlePublish}
                disabled={isPublishing || (isUploading && uploadedImages.length === 0)}
                fullWidth
                sx={{
                  py: 1.25,
                  bgcolor: colors.accent,
                  color: colors.background,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: colors.accentHover },
                  '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                }}
              >
                {isPublishing ? 'Publishing...' : 'Share'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={successSnackbar}
        autoHideDuration={5000}
        onClose={() => setSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessSnackbar(false)}
          icon={false}
          sx={{
            bgcolor: colors.success,
            color: '#fff',
            fontWeight: 500,
            '& .MuiAlert-action': { color: '#fff' },
          }}
        >
          {selectedArtist
            ? 'Your tattoo has been submitted! The artist will be notified for approval.'
            : 'Your tattoo has been added to your profile!'}
        </Alert>
      </Snackbar>
    </>
  );
}
