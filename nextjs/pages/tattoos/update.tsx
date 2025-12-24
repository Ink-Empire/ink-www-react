import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useStyles } from '@/contexts/StyleContext';
import { fetchCsrfToken, getCsrfToken } from '@/utils/api';
import { getToken } from '@/utils/auth';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { colors } from '@/styles/colors';
import TagsAutocomplete, { Tag } from '@/components/TagsAutocomplete';

// Styles that mirror the HTML design
const styles = {
  container: {
    maxWidth: 600,
    mx: 'auto',
    px: 2,
    pt: 3,
    pb: '140px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 4,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: colors.textSecondary,
    fontSize: '0.875rem',
    p: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      color: colors.textPrimary,
      bgcolor: 'rgba(40, 40, 40, 1)',
    },
  },
  pageTitle: {
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 500,
    color: colors.textPrimary,
  },
  heroImageContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    mx: 'auto',
    mb: 2,
    aspectRatio: '1',
    borderRadius: '16px',
    overflow: 'hidden',
    bgcolor: colors.surface,
  },
  heroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    bgcolor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    px: 1.5,
    py: 0.75,
    borderRadius: '20px',
    fontSize: '0.75rem',
    color: colors.textSecondary,
  },
  thumbnailStrip: {
    display: 'flex',
    justifyContent: 'center',
    gap: 1.5,
    flexWrap: 'wrap',
    mb: 4,
  },
  thumbnailItem: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: colors.border,
      '& .delete-btn': {
        opacity: 1,
      },
    },
  },
  thumbnailActive: {
    borderColor: colors.accent,
    boxShadow: `0 0 0 2px rgba(201, 169, 98, 0.15)`,
  },
  thumbnailDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    bgcolor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '50%',
    color: colors.textSecondary,
    opacity: 0,
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: colors.error,
      color: 'white',
    },
  },
  thumbnailAdd: {
    width: 72,
    height: 72,
    borderRadius: '10px',
    border: `2px dashed ${colors.border}`,
    bgcolor: 'transparent',
    color: colors.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: colors.accent,
      color: colors.accent,
      bgcolor: 'rgba(201, 169, 98, 0.15)',
    },
  },
  formSection: {
    mb: 3,
  },
  formLabel: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: colors.textSecondary,
    mb: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formInput: {
    width: '100%',
    bgcolor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    p: '14px 16px',
    color: colors.textPrimary,
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s',
    '&:focus': {
      borderColor: colors.accent,
      boxShadow: `0 0 0 3px rgba(201, 169, 98, 0.15)`,
    },
    '&::placeholder': {
      color: colors.textMuted,
    },
  },
  selectedChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    mb: 1.5,
    minHeight: 36,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.75,
    py: 1,
    bgcolor: 'rgba(201, 169, 98, 0.15)',
    border: `1px solid ${colors.accentDim}`,
    borderRadius: '20px',
    fontSize: '0.8125rem',
    color: colors.accent,
    fontWeight: 500,
  },
  chipRemove: {
    bgcolor: 'transparent',
    border: 'none',
    color: colors.accentDim,
    cursor: 'pointer',
    p: 0,
    display: 'flex',
    fontSize: '1rem',
    '&:hover': {
      color: colors.accent,
    },
  },
  selectorToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
    p: '12px 16px',
    bgcolor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: colors.textSecondary,
    fontSize: '0.875rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: colors.accentDim,
      bgcolor: 'rgba(40, 40, 40, 1)',
    },
  },
  selectorToggleActive: {
    borderColor: colors.accent,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectorDropdown: {
    bgcolor: colors.surface,
    border: `1px solid ${colors.accent}`,
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    p: 2,
  },
  styleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 1,
  },
  styleOption: {
    p: '12px 16px',
    bgcolor: 'rgba(40, 40, 40, 1)',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: colors.textSecondary,
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    '&:hover': {
      bgcolor: 'rgba(51, 51, 51, 1)',
      color: colors.textPrimary,
    },
  },
  styleOptionSelected: {
    bgcolor: 'rgba(201, 169, 98, 0.15)',
    borderColor: colors.accent,
    color: colors.accent,
  },
  fixedFooter: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    bgcolor: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    p: 2,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 50,
  },
  footerInner: {
    display: 'flex',
    gap: 1.5,
    width: '100%',
    maxWidth: 600,
  },
  btn: {
    flex: 1,
    p: '14px 24px',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    border: 'none',
  },
  btnSecondary: {
    bgcolor: 'transparent',
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    '&:hover': {
      borderColor: colors.textMuted,
      color: colors.textPrimary,
    },
  },
  btnPrimary: {
    bgcolor: colors.accent,
    color: colors.background,
    fontWeight: 600,
    '&:hover': {
      bgcolor: colors.accentDim,
    },
    '&:disabled': {
      bgcolor: colors.accentDim,
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
};

// Track existing images from API
interface ExistingImage {
  id: number;
  url: string;
}

export default function UpdateTattoo() {
  const router = useRouter();
  const { id: tattooId } = router.query;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [tattoo, setTattoo] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [stylesOpen, setStylesOpen] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { styles: availableStyles } = useStyles();

  // Combine existing and new images for display
  const allImages = [
    ...existingImages.map(img => ({ type: 'existing' as const, id: img.id, url: img.url })),
    ...newImagePreviews.map((url, idx) => ({ type: 'new' as const, index: idx, url })),
  ];

  // Fetch tattoo data
  useEffect(() => {
    if (tattooId && isAuthenticated && !authLoading) {
      fetchTattooData(tattooId as string);
    }
  }, [tattooId, isAuthenticated, authLoading]);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchTattooData = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const authToken = getToken();
      const csrfToken = getCsrfToken();

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;

      const response = await fetch(`/api/tattoos/${id}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to load tattoo data');

      const responseData = await response.json();
      const data = responseData.tattoo || responseData;
      setTattoo(data);

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);

      if (data.styles && Array.isArray(data.styles)) {
        setSelectedStyles(data.styles.map((s: any) => typeof s === 'object' ? s.id : s));
      }

      if (data.tags && Array.isArray(data.tags)) {
        // Convert tags to Tag[] format for TagsAutocomplete
        const tagObjects: Tag[] = data.tags.map((t: any) => {
          if (typeof t === 'object') {
            return { id: t.id, name: t.name || t.tag || '', slug: t.slug || '' };
          }
          return { id: t, name: '', slug: '' };
        }).filter((t: Tag) => t.name);
        setSelectedTags(tagObjects);
      }

      // Get existing images with their IDs
      const images: ExistingImage[] = [];
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        data.images.forEach((img: any) => {
          const uri = img.uri || img.url || img.path;
          if (uri && img.id) {
            images.push({ id: img.id, url: uri });
          }
        });
      }
      if (images.length === 0 && data.primary_image) {
        const primaryUri = data.primary_image.uri || data.primary_image.url;
        if (primaryUri && data.primary_image.id) {
          images.push({ id: data.primary_image.id, url: primaryUri });
        }
      }
      setExistingImages(images);
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setDeletedImageIds([]);

    } catch (error) {
      console.error('Error fetching tattoo data:', error);
      setError('Could not load tattoo data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tattooId || !description) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();
      const authToken = getToken();

      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append('title', title || 'Untitled Tattoo');
      formData.append('description', description);

      // Add styles as JSON
      if (selectedStyles.length > 0) {
        formData.append('styles', JSON.stringify(selectedStyles));
      }

      // Add tags as JSON
      if (selectedTags.length > 0) {
        formData.append('tag_ids', JSON.stringify(selectedTags.map(t => t.id)));
      }

      // Add deleted image IDs
      if (deletedImageIds.length > 0) {
        formData.append('deleted_image_ids', JSON.stringify(deletedImageIds));
      }

      // Add new image files
      newImageFiles.forEach(file => {
        formData.append('files[]', file);
      });

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;

      // Use POST with _method override for Laravel (FormData with PUT can be tricky)
      formData.append('_method', 'PUT');

      const response = await fetch(`/api/tattoos/${tattooId}`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update tattoo');
      }

      router.back();
    } catch (error) {
      console.error('Error updating tattoo:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStyle = (styleId: number) => {
    setSelectedStyles(prev =>
      prev.includes(styleId) ? prev.filter(id => id !== styleId) : [...prev, styleId]
    );
  };

  const removeStyle = (styleId: number) => {
    setSelectedStyles(prev => prev.filter(id => id !== styleId));
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Edit Tattoo | InkedIn</title>
      </Head>

      <Box sx={styles.container}>
        {/* Header */}
        <Box sx={styles.pageHeader}>
          <Box sx={styles.backBtn} onClick={() => router.back()}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
            Back
          </Box>
          <Typography sx={styles.pageTitle}>Edit Tattoo</Typography>
          <Box sx={{ width: 80 }} />
        </Box>

        {error && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(232, 84, 84, 0.1)', color: colors.error, borderRadius: '10px', border: `1px solid rgba(232, 84, 84, 0.4)` }}>
            {error}
          </Box>
        )}

        {/* Image Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ ...styles.heroImageContainer, '&:hover .hero-delete-btn': { opacity: 1 } }}>
            {allImages[selectedImageIndex] ? (
              <Image
                src={allImages[selectedImageIndex].url}
                alt="Tattoo preview"
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textMuted }}>
                No image
              </Box>
            )}
            {allImages.length > 0 && selectedImageIndex === 0 && (
              <Box sx={styles.heroBadge}>Primary Image</Box>
            )}
            {/* Delete button on hero image */}
            {allImages.length > 0 && (
              <IconButton
                className="hero-delete-btn"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: colors.textSecondary,
                  opacity: 0,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: colors.error,
                    color: 'white',
                  },
                }}
                onClick={() => {
                  const currentImage = allImages[selectedImageIndex];
                  if (allImages.length === 1) {
                    if (confirm('This is your only image. Are you sure you want to remove it?')) {
                      if (currentImage.type === 'existing') {
                        setDeletedImageIds(prev => [...prev, currentImage.id]);
                        setExistingImages(prev => prev.filter(img => img.id !== currentImage.id));
                      } else {
                        const idx = currentImage.index;
                        URL.revokeObjectURL(newImagePreviews[idx]);
                        setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
                        setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                      }
                      setSelectedImageIndex(0);
                    }
                  } else {
                    if (currentImage.type === 'existing') {
                      setDeletedImageIds(prev => [...prev, currentImage.id]);
                      setExistingImages(prev => prev.filter(img => img.id !== currentImage.id));
                    } else {
                      const idx = currentImage.index;
                      URL.revokeObjectURL(newImagePreviews[idx]);
                      setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
                      setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                    }
                    setSelectedImageIndex(Math.min(selectedImageIndex, allImages.length - 2));
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>

          {/* Thumbnail strip + Add button */}
          <Box sx={styles.thumbnailStrip}>
            {allImages.length > 1 && allImages.map((img, index) => (
              <Box
                key={img.type === 'existing' ? `existing-${img.id}` : `new-${img.index}`}
                sx={{
                  ...styles.thumbnailItem,
                  ...(index === selectedImageIndex ? styles.thumbnailActive : {}),
                }}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image src={img.url} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                <IconButton
                  className="delete-btn"
                  sx={styles.thumbnailDelete}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (img.type === 'existing') {
                      setDeletedImageIds(prev => [...prev, img.id]);
                      setExistingImages(prev => prev.filter(i => i.id !== img.id));
                    } else {
                      const idx = img.index;
                      URL.revokeObjectURL(newImagePreviews[idx]);
                      setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
                      setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                    }
                    setSelectedImageIndex(Math.min(selectedImageIndex, allImages.length - 2));
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
            <Box
              component="button"
              sx={styles.thumbnailAdd}
              onClick={() => fileInputRef.current?.click()}
            >
              <AddIcon />
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const fileArray = Array.from(files);
                  const previews = fileArray.map(file => URL.createObjectURL(file));
                  setNewImageFiles(prev => [...prev, ...fileArray]);
                  setNewImagePreviews(prev => [...prev, ...previews]);
                }
                e.target.value = '';
              }}
            />
          </Box>
        </Box>

        {/* Title */}
        <Box sx={styles.formSection}>
          <Typography component="label" sx={styles.formLabel}>
            Title (Optional)
          </Typography>
          <Box
            component="input"
            type="text"
            sx={styles.formInput}
            placeholder="Give your tattoo a name"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          />
        </Box>

        {/* Description */}
        <Box sx={styles.formSection}>
          <Typography component="label" sx={styles.formLabel}>
            Description <Box component="span" sx={{ color: colors.accent }}>*</Box>
          </Typography>
          <Box
            component="textarea"
            sx={{ ...styles.formInput, minHeight: 100, resize: 'vertical' }}
            placeholder="Describe your tattoo..."
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          />
        </Box>

        {/* Styles - Expandable */}
        <Box sx={styles.formSection}>
          <Typography sx={styles.formLabel}>Tattoo Styles</Typography>

          {selectedStyles.length > 0 && (
            <Box sx={styles.selectedChips}>
              {selectedStyles.map(styleId => {
                const style = availableStyles.find(s => s.id === styleId);
                return style ? (
                  <Box key={styleId} sx={styles.chip}>
                    {style.name}
                    <Box component="button" sx={styles.chipRemove} onClick={() => removeStyle(styleId)}>
                      ×
                    </Box>
                  </Box>
                ) : null;
              })}
            </Box>
          )}

          <Box
            component="button"
            sx={{
              ...styles.selectorToggle,
              ...(stylesOpen ? styles.selectorToggleActive : {}),
            }}
            onClick={() => setStylesOpen(!stylesOpen)}
          >
            <span>Select Styles</span>
            <KeyboardArrowDownIcon sx={{ transition: 'transform 0.2s', transform: stylesOpen ? 'rotate(180deg)' : 'none' }} />
          </Box>

          {stylesOpen && (
            <Box sx={styles.selectorDropdown}>
              <Box sx={styles.styleGrid}>
                {availableStyles.map(style => (
                  <Box
                    key={style.id}
                    component="button"
                    sx={{
                      ...styles.styleOption,
                      ...(selectedStyles.includes(style.id) ? styles.styleOptionSelected : {}),
                    }}
                    onClick={() => toggleStyle(style.id)}
                  >
                    {style.name}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Tags */}
        <Box sx={styles.formSection}>
          <Typography sx={styles.formLabel}>Subject Tags</Typography>
          <TagsAutocomplete
            value={selectedTags}
            onChange={setSelectedTags}
            label=""
            placeholder="Search and add tags..."
            maxTags={10}
          />
        </Box>
      </Box>

      {/* Fixed Footer */}
      <Box sx={styles.fixedFooter}>
        <Box sx={styles.footerInner}>
          <Box
            component="button"
            sx={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => router.back()}
          >
            Cancel
          </Box>
          <Box
            component="button"
            sx={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleSubmit}
            disabled={isSubmitting || !description}
          >
            {isSubmitting ? 'Saving...' : 'Save Tattoo'}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
