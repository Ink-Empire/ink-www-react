import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent, IconButton,
  TextField, Avatar, CircularProgress, Snackbar, Alert, Chip,
  useMediaQuery, useTheme, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { colors, inputStyles } from '@/styles/colors';
import { LocationAutocomplete } from '@/components/SearchFilters/LocationAutocomplete';
import { uploadImagesToS3, UploadedImage, UploadProgress } from '@/utils/s3Upload';
import { messageService } from '@/services/messageService';
import { tattooService } from '@/services/tattooService';
import { userService } from '@/services/userService';
import { clearCache } from '@/utils/apiCache';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';
import { stylesService } from '@/services/stylesService';
import { tagService } from '@/services/tagService';
import type { AiStyleSuggestion } from '@/services/stylesService';
import type { AiTagSuggestion } from '@/services/tagService';

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

const STEPS = ['Images', 'Details', 'Styles & Tags', 'Review'];
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

  // Step 1: Styles & Tags
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const { styles: allStyles } = useStyles();
  const { tags: allTags } = useTags();

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistResult | null>(null);
  const [searchingArtists, setSearchingArtists] = useState(false);

  // Attribution mode: 'search' = search InkedIn, 'manual' = off-platform
  const [artistMode, setArtistMode] = useState<'search' | 'manual'>('search');
  const [attributedArtistName, setAttributedArtistName] = useState('');
  const [attributedStudioName, setAttributedStudioName] = useState('');
  const [attributedLocation, setAttributedLocation] = useState('');
  const [attributedLocationLatLong, setAttributedLocationLatLong] = useState('');
  const [artistInviteEmail, setArtistInviteEmail] = useState('');
  const [emailExistsOnPlatform, setEmailExistsOnPlatform] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // AI suggestions
  const [aiStyleSuggestions, setAiStyleSuggestions] = useState<AiStyleSuggestion[]>([]);
  const [aiTagSuggestions, setAiTagSuggestions] = useState<AiTagSuggestion[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [addingAiTag, setAddingAiTag] = useState<string | null>(null);
  const [createdTags, setCreatedTags] = useState<{ id: number; name: string }[]>([]);

  // Tag search
  const [tagSearch, setTagSearch] = useState('');

  // Reset all state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setFiles([]);
      setPreviews([]);
      setUploadedImages([]);
      setUploadProgress(null);
      setIsUploading(false);
      setSelectedStyleIds([]);
      setSelectedTagIds([]);
      setTitle('');
      setDescription('');
      setArtistQuery('');
      setArtistResults([]);
      setSelectedArtist(null);
      setArtistMode('search');
      setAttributedArtistName('');
      setAttributedStudioName('');
      setAttributedLocation('');
      setArtistInviteEmail('');
      setEmailExistsOnPlatform(false);
      setCheckingEmail(false);
      setIsPublishing(false);
      setErrorMessage('');
      setTagSearch('');
      setAiStyleSuggestions([]);
      setAiTagSuggestions([]);
      setLoadingAiSuggestions(false);
      setAddingAiTag(null);
    }
  }, [open]);

  // Cleanup preview URLs on unmount only
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;
  useEffect(() => {
    return () => {
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

  // Debounced email availability check for invite flow
  useEffect(() => {
    const email = artistInviteEmail.trim();
    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailExistsOnPlatform(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const response = await userService.checkEmailAvailability(email);
        setEmailExistsOnPlatform(!response.available);
      } catch {
        setEmailExistsOnPlatform(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [artistInviteEmail]);

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
    setUploadedImages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
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

  // Fetch AI suggestions for both styles and tags (runs in background)
  const fetchAiSuggestions = async (imageUrls: string[]) => {
    setLoadingAiSuggestions(true);
    try {
      const [styleRes, tagRes] = await Promise.all([
        stylesService.suggestStyles(imageUrls).catch((err: any) => {
          console.error('[AI Suggestions] Style suggestion failed:', err);
          return null;
        }),
        tagService.suggestTags(imageUrls).catch((err: any) => {
          console.error('[AI Suggestions] Tag suggestion failed:', err);
          return null;
        }),
      ]);

      if (styleRes?.success && styleRes.data) {
        setAiStyleSuggestions(styleRes.data.filter(
          s => !selectedStyleIds.includes(s.id)
        ));
      }
      if (tagRes?.success && tagRes.data) {
        setAiTagSuggestions(tagRes.data.filter(
          t => t.id === null || !selectedTagIds.includes(t.id as number)
        ));
      }
    } catch (err) {
      console.error('[AI Suggestions] Unexpected error:', err);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  // Advance from step 0 to step 1 - start uploading in background
  const handleNextFromImages = async () => {
    setStep(1);
    if (uploadedImages.length === 0 && files.length > 0) {
      setIsUploading(true);
      try {
        const images = await uploadImagesToS3(files, 'tattoo', setUploadProgress);
        setUploadedImages(images);
        // Fetch AI suggestions with the uploaded image URLs
        const imageUrls = images.map(img => img.uri);
        fetchAiSuggestions(imageUrls);
      } catch (err) {
        console.error('Upload failed:', err);
        setErrorMessage('Image upload failed. Please try again.');
        setStep(0);
      } finally {
        setIsUploading(false);
      }
    } else if (uploadedImages.length > 0 && aiStyleSuggestions.length === 0 && aiTagSuggestions.length === 0 && !loadingAiSuggestions) {
      // Already uploaded but no suggestions fetched yet
      fetchAiSuggestions(uploadedImages.map(img => img.uri));
    }
  };

  const toggleStyle = (id: number) => {
    setSelectedStyleIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAddAiStyleSuggestion = (style: AiStyleSuggestion) => {
    setSelectedStyleIds(prev => prev.includes(style.id) ? prev : [...prev, style.id]);
    setAiStyleSuggestions(prev => prev.filter(s => s.id !== style.id));
  };

  const handleAddAiTagSuggestion = async (tag: AiTagSuggestion) => {
    let tagId = tag.id;

    if (tagId === null || tag.is_new_suggestion) {
      setAddingAiTag(tag.name);
      try {
        const response = await tagService.createFromAi(tag.name);
        if (response.success && response.data) {
          tagId = response.data.id;
        } else {
          setAddingAiTag(null);
          return;
        }
      } catch {
        setAddingAiTag(null);
        return;
      }
      setAddingAiTag(null);
    }

    if (tagId) {
      if (!allTags.find(t => t.id === tagId)) {
        setCreatedTags(prev => [...prev, { id: tagId as number, name: tag.name }]);
      }
      setSelectedTagIds(prev => prev.includes(tagId as number) ? prev : [...prev, tagId as number]);
      setAiTagSuggestions(prev => prev.filter(t => t.name !== tag.name));
    }
  };

  const hasAttribution = artistMode === 'manual' && attributedArtistName.trim();

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage('');

    try {
      let imageIds = uploadedImages.map(img => img.id);
      if (imageIds.length === 0) {
        const images = await uploadImagesToS3(files, 'tattoo', setUploadProgress);
        imageIds = images.map(img => img.id);
        setUploadedImages(images);
      }

      const payload: Parameters<typeof tattooService.clientUpload>[0] = {
        image_ids: imageIds,
      };

      if (title.trim()) payload.title = title.trim();
      if (description.trim()) payload.description = description.trim();
      if (selectedArtist && artistMode === 'search') {
        payload.tagged_artist_id = selectedArtist.id;
      }
      if (selectedStyleIds.length > 0) {
        payload.style_ids = JSON.stringify(selectedStyleIds);
      }
      if (selectedTagIds.length > 0) {
        payload.tag_ids = JSON.stringify(selectedTagIds);
      }
      if (artistMode === 'manual') {
        if (attributedArtistName.trim()) payload.attributed_artist_name = attributedArtistName.trim();
        if (attributedStudioName.trim()) payload.attributed_studio_name = attributedStudioName.trim();
        if (attributedLocation.trim()) payload.attributed_location = attributedLocation.trim();
        if (attributedLocationLatLong) payload.attributed_location_lat_long = attributedLocationLatLong;
        if (artistInviteEmail.trim()) payload.artist_invite_email = artistInviteEmail.trim();
      }

      await tattooService.clientUpload(payload);

      clearCache('tattoo');
      clearCache('user');

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

  const filteredTags = tagSearch.length >= 2
    ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags.slice(0, 20);

  const getVisibilityMessage = () => {
    if (selectedArtist && artistMode === 'search') {
      return 'This tattoo will appear on your profile immediately and in the main feed after the artist approves.';
    }
    return 'This tattoo will be visible on the main feed immediately.';
  };

  const getSuccessMessage = () => {
    if (selectedArtist && artistMode === 'search') {
      return 'Your tattoo has been submitted! The artist will be notified for approval.';
    }
    if (artistInviteEmail.trim()) {
      return 'Your tattoo has been shared! An invitation has been sent to the artist.';
    }
    return 'Your tattoo has been shared to the feed!';
  };

  const nextBtnSx = {
    py: 1.25,
    bgcolor: colors.accent,
    color: colors.background,
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    '&:hover': { bgcolor: colors.accentHover },
    '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
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
                fontSize: '0.65rem',
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

              <Button
                onClick={handleNextFromImages}
                disabled={files.length === 0}
                fullWidth
                sx={{
                  mt: 3,
                  ...nextBtnSx,
                  bgcolor: files.length > 0 ? colors.accent : colors.border,
                  color: files.length > 0 ? colors.background : colors.textMuted,
                  '&:hover': { bgcolor: files.length > 0 ? colors.accentHover : colors.border },
                }}
              >
                Next
              </Button>
            </Box>
          )}

          {/* Step 2: Styles & Tags */}
          {step === 2 && (
            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Image preview */}
              {previews.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, overflow: 'auto' }}>
                  {previews.map((preview, i) => (
                    <Box
                      key={preview}
                      component="img"
                      src={preview}
                      alt={`Tattoo ${i + 1}`}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: i === 0 ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Box>
              )}

              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.5 }}>
                To the best of your ability, select the styles and tags that describe this tattoo. No worries if you're not sure — every bit helps.
              </Typography>

              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 1 }}>
                  Styles
                </Typography>
                {(loadingAiSuggestions || aiStyleSuggestions.length > 0) && (
                  <Box sx={{ mb: 1, p: 1, bgcolor: colors.aiSuggestionDim, borderRadius: '8px', border: `1px solid ${colors.aiSuggestion}30` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14, color: colors.aiSuggestion }} />
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.aiSuggestion, letterSpacing: '0.08em' }}>
                        SUGGESTIONS
                      </Typography>
                      {loadingAiSuggestions && aiStyleSuggestions.length === 0 && (
                        <CircularProgress size={12} sx={{ color: colors.aiSuggestion }} />
                      )}
                    </Box>
                    {loadingAiSuggestions && aiStyleSuggestions.length === 0 && (
                      <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, fontStyle: 'italic' }}>
                        Analyzing your images...
                      </Typography>
                    )}
                    {aiStyleSuggestions.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {aiStyleSuggestions.map(style => (
                          <Chip
                            key={style.id}
                            label={style.name}
                            onClick={() => handleAddAiStyleSuggestion(style)}
                            size="small"
                            icon={<AddIcon sx={{ fontSize: 14, color: `${colors.aiSuggestion} !important` }} />}
                            sx={{
                              bgcolor: 'transparent',
                              color: colors.aiSuggestion,
                              border: `1px solid ${colors.aiSuggestion}`,
                              fontSize: '0.75rem',
                              '&:hover': { bgcolor: `${colors.aiSuggestion}20` },
                              '& .MuiChip-icon': { marginLeft: '4px' },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {allStyles.map((style) => (
                    <Chip
                      key={style.id}
                      label={style.name}
                      onClick={() => toggleStyle(style.id)}
                      sx={{
                        bgcolor: selectedStyleIds.includes(style.id) ? colors.accent : colors.background,
                        color: selectedStyleIds.includes(style.id) ? colors.background : colors.textSecondary,
                        border: `1px solid ${selectedStyleIds.includes(style.id) ? colors.accent : colors.border}`,
                        fontWeight: selectedStyleIds.includes(style.id) ? 600 : 400,
                        fontSize: '0.8rem',
                        '&:hover': {
                          bgcolor: selectedStyleIds.includes(style.id) ? colors.accentHover : `${colors.accent}15`,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 0.75 }}>
                  Tags
                </Typography>
                {(loadingAiSuggestions || aiTagSuggestions.length > 0) && (
                  <Box sx={{ mb: 1, p: 1, bgcolor: colors.aiSuggestionDim, borderRadius: '8px', border: `1px solid ${colors.aiSuggestion}30` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14, color: colors.aiSuggestion }} />
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.aiSuggestion, letterSpacing: '0.08em' }}>
                        SUGGESTIONS
                      </Typography>
                      {loadingAiSuggestions && aiTagSuggestions.length === 0 && (
                        <CircularProgress size={12} sx={{ color: colors.aiSuggestion }} />
                      )}
                    </Box>
                    {loadingAiSuggestions && aiTagSuggestions.length === 0 && (
                      <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, fontStyle: 'italic' }}>
                        Analyzing your images...
                      </Typography>
                    )}
                    {aiTagSuggestions.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {aiTagSuggestions.map(tag => {
                          const isNew = tag.id === null || tag.is_new_suggestion;
                          const isCreating = addingAiTag === tag.name;
                          return (
                            <Chip
                              key={tag.name}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {tag.name}
                                  {isNew && !isCreating && (
                                    <Box component="span" sx={{ fontSize: '0.6rem', opacity: 0.7 }}>NEW</Box>
                                  )}
                                </Box>
                              }
                              onClick={() => !isCreating && handleAddAiTagSuggestion(tag)}
                              disabled={isCreating}
                              size="small"
                              icon={isCreating
                                ? <CircularProgress size={12} sx={{ color: `${colors.aiSuggestion} !important` }} />
                                : <AddIcon sx={{ fontSize: 14, color: `${colors.aiSuggestion} !important` }} />
                              }
                              sx={{
                                bgcolor: 'transparent',
                                color: colors.aiSuggestion,
                                border: `1px solid ${colors.aiSuggestion}`,
                                borderStyle: isNew ? 'dashed' : 'solid',
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: `${colors.aiSuggestion}20` },
                                '& .MuiChip-icon': { marginLeft: '4px' },
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
                <TextField
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  fullWidth
                  size="small"
                  sx={{ ...inputStyles.textField, mb: 1 }}
                />
                {selectedTagIds.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {selectedTagIds.map(id => {
                      const tag = allTags.find(t => t.id === id) || createdTags.find(t => t.id === id);
                      if (!tag) return null;
                      return (
                        <Chip
                          key={id}
                          label={tag.name}
                          onDelete={() => toggleTag(id)}
                          size="small"
                          sx={{
                            bgcolor: `${colors.tag}20`,
                            color: colors.tag,
                            border: `1px solid ${colors.tag}40`,
                            '& .MuiChip-deleteIcon': { color: colors.tag, '&:hover': { color: colors.error } },
                          }}
                          icon={<LocalOfferIcon sx={{ fontSize: 12, color: colors.tag }} />}
                        />
                      );
                    })}
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 150, overflow: 'auto' }}>
                  {filteredTags
                    .filter(t => !selectedTagIds.includes(t.id))
                    .slice(0, 30)
                    .map(tag => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        onClick={() => toggleTag(tag.id)}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: colors.textSecondary,
                          borderColor: colors.border,
                          fontSize: '0.75rem',
                          '&:hover': { bgcolor: `${colors.tag}10`, borderColor: colors.tag },
                        }}
                      />
                    ))}
                </Box>
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

              <Button onClick={() => setStep(3)} fullWidth sx={nextBtnSx}>
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

              {/* Artist Attribution */}
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary, mb: 0.75 }}>
                  Artist (optional)
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  {([['search', 'Search'], ['manual', 'Invite']] as const).map(([value, label]) => (
                    <Button
                      key={value}
                      onClick={() => { setArtistMode(value); clearArtist(); }}
                      sx={{
                        flex: 1,
                        py: 0.9,
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        ...(artistMode === value
                          ? { bgcolor: colors.accent, color: colors.background, '&:hover': { bgcolor: colors.accentHover } }
                          : { bgcolor: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, '&:hover': { bgcolor: `${colors.accent}10`, borderColor: colors.accent } }
                        ),
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Box>

                {artistMode === 'search' && (
                  <>
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
                  </>
                )}

                {artistMode === 'manual' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      value={attributedArtistName}
                      onChange={(e) => setAttributedArtistName(e.target.value)}
                      placeholder="Artist name"
                      fullWidth
                      size="small"
                      sx={inputStyles.textField}
                    />
                    <TextField
                      value={attributedStudioName}
                      onChange={(e) => setAttributedStudioName(e.target.value)}
                      placeholder="Studio/Shop name (optional)"
                      fullWidth
                      size="small"
                      sx={inputStyles.textField}
                    />
                    <LocationAutocomplete
                      value={attributedLocation}
                      onChange={(location, coords) => {
                        setAttributedLocation(location);
                        setAttributedLocationLatLong(coords ? `${coords.lat},${coords.lng}` : '');
                      }}
                      placeholder="City/Location (optional)"
                    />
                    <TextField
                      value={artistInviteEmail}
                      onChange={(e) => setArtistInviteEmail(e.target.value)}
                      placeholder="Artist email (sends invite)"
                      fullWidth
                      size="small"
                      type="email"
                      sx={inputStyles.textField}
                      InputProps={{
                        endAdornment: checkingEmail ? (
                          <CircularProgress size={18} sx={{ color: colors.accent }} />
                        ) : null,
                      }}
                    />
                    {emailExistsOnPlatform ? (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        bgcolor: `${colors.accent}10`,
                        border: `1px solid ${colors.accent}40`,
                        borderRadius: '8px',
                      }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.accent, lineHeight: 1.4, flex: 1 }}>
                          This email belongs to an artist already on InkedIn. You can tag them directly instead of sending an invite.
                        </Typography>
                        <Button
                          onClick={() => {
                            const email = artistInviteEmail.trim();
                            setArtistMode('search');
                            setArtistInviteEmail('');
                            setEmailExistsOnPlatform(false);
                            setAttributedArtistName('');
                            setAttributedStudioName('');
                            setAttributedLocation('');
                            setAttributedLocationLatLong('');
                            setArtistQuery(email);
                          }}
                          size="small"
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: colors.background,
                            bgcolor: colors.accent,
                            borderRadius: '16px',
                            px: 2,
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: colors.accentHover },
                          }}
                        >
                          Search instead
                        </Button>
                      </Box>
                    ) : artistInviteEmail.trim() && !checkingEmail ? (
                      <Typography sx={{ fontSize: '0.75rem', color: colors.info, lineHeight: 1.4 }}>
                        An invitation email will be sent so the artist can claim this tattoo on InkedIn.
                      </Typography>
                    ) : null}
                  </Box>
                )}
              </Box>

              <Button onClick={() => setStep(2)} fullWidth sx={nextBtnSx}>
                Next
              </Button>
            </Box>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
                {selectedStyleIds.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.5 }}>Styles</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {allStyles.filter(s => selectedStyleIds.includes(s.id)).map(s => (
                        <Chip key={s.id} label={s.name} size="small" sx={{ bgcolor: `${colors.accent}20`, color: colors.accent, fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedTagIds.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.5 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {[...allTags, ...createdTags].filter(t => selectedTagIds.includes(t.id)).map(t => (
                        <Chip key={t.id} label={t.name} size="small" sx={{ bgcolor: `${colors.tag}20`, color: colors.tag, fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedArtist && artistMode === 'search' && (
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
                    </Box>
                  </Box>
                )}
                {hasAttribution && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.5 }}>Attributed Artist</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: 500 }}>
                      {attributedArtistName.trim()}
                      {attributedStudioName.trim() && ` at ${attributedStudioName.trim()}`}
                      {attributedLocation.trim() && ` - ${attributedLocation.trim()}`}
                    </Typography>
                    {artistInviteEmail.trim() && (
                      <Typography sx={{ fontSize: '0.75rem', color: colors.info, mt: 0.5 }}>
                        Invitation will be sent to {artistInviteEmail.trim()}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{
                p: 1.5,
                bgcolor: `${colors.info}12`,
                border: `1px solid ${colors.info}30`,
                borderRadius: '8px',
                mb: 3,
              }}>
                <Typography sx={{ fontSize: '0.8rem', color: colors.info, lineHeight: 1.5 }}>
                  {getVisibilityMessage()}
                </Typography>
              </Box>

              {errorMessage && (
                <Typography sx={{ fontSize: '0.8rem', color: colors.error, mb: 2, textAlign: 'center' }}>
                  {errorMessage}
                </Typography>
              )}

              <Button
                onClick={handlePublish}
                disabled={isPublishing || (isUploading && uploadedImages.length === 0)}
                fullWidth
                sx={nextBtnSx}
              >
                {isPublishing ? 'Publishing...' : 'Share'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

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
          {getSuccessMessage()}
        </Alert>
      </Snackbar>
    </>
  );
}
