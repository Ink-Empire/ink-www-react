import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';
import { fetchCsrfToken, getCsrfToken } from '@/utils/api';
import { getToken } from '@/utils/auth';
import StyleModal from '@/components/StyleModal';
import TagModal from '@/components/TagModal';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import { colors } from '@/styles/colors';

export default function UpdateTattoo() {
  const router = useRouter();
  const { id: tattooId } = router.query;
  const [tattoo, setTattoo] = useState<any>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [about, setAbout] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const { user, isAuthenticated } = useAuth();
  const { styles } = useStyles();
  const { tags } = useTags();

  // Fetch tattoo data based on ID in URL
  useEffect(() => {
    if (tattooId && isAuthenticated) {
      console.log('Fetching data for tattoo ID:', tattooId);
      fetchTattooData(tattooId as string);
    }
  }, [tattooId, isAuthenticated]);

  // Check session storage for a pending tattoo ID on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingTattooId = sessionStorage.getItem('pendingTattooUpdate');
      if (pendingTattooId && !tattooId) {
        console.log('Found pending tattoo ID in session storage:', pendingTattooId);
        // Update the URL with the tattoo ID without refreshing the page
        router.replace(`/tattoos/update?id=${pendingTattooId}`, undefined, { shallow: true });
      }
    }
  }, []);
  
  // Require authentication
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      const currentPath = router.asPath;
      // Store the current tattoo ID in session storage before redirecting
      if (tattooId && typeof window !== 'undefined') {
        sessionStorage.setItem('pendingTattooUpdate', tattooId.toString());
      }
      router.push('/login?redirect=' + encodeURIComponent(currentPath));
    } else if (tattooId) {
      // If authenticated and we have a tattoo ID, clear the session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingTattooUpdate');
      }
    }
  }, [isAuthenticated, router, tattooId]);

  // Fetch tattoo data including images
  const fetchTattooData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authToken = getToken();
      const csrfToken = getCsrfToken();
      
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
      
      // Get the tattoo data
      const response = await fetch(`/api/tattoos/${id}`, {
        headers,
        credentials: 'include'
      });

      console.log(response);
      
      if (!response.ok) {
        throw new Error('Failed to load tattoo data');
      }
      
      const data = await response.json();
      setTattoo(data);
      
      // Set form values from tattoo data
      if (data.title) {
        setTitle(data.title);
      }
      
      if (data.about) {
        setAbout(data.about);
      }
      
      // Set styles if present
      if (data.styles && Array.isArray(data.styles)) {
        // Handle both array of style objects and array of style IDs
        const styleIds = data.styles.map((style: any) =>
          typeof style === 'object' ? style.id : style
        );
        setSelectedStyles(styleIds);
      }

      // Set tags if present
      if (data.tags && Array.isArray(data.tags)) {
        // Handle both array of tag objects and array of tag IDs
        const tagIds = data.tags.map((tag: any) =>
          typeof tag === 'object' ? tag.id : tag
        );
        setSelectedTags(tagIds);
      }
      
      // Get image URLs
      if (data.images && Array.isArray(data.images)) {
        const urls = data.images.map((img: any) => 
          img.uri || img.url || (img.primary_image && img.primary_image.uri)
        ).filter(Boolean);
        
        setImagePreviewUrls(urls);
      } else if (data.primary_image && data.primary_image.uri) {
        setImagePreviewUrls([data.primary_image.uri]);
      }
      
    } catch (error) {
      console.error('Error fetching tattoo data:', error);
      setError('Could not load tattoo data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle style selection
  const handleApplyStyles = (updatedStyles: number[]) => {
    setSelectedStyles(updatedStyles);
  };

  // Handle tag selection
  const handleApplyTags = (updatedTags: number[]) => {
    setSelectedTags(updatedTags);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!tattooId) {
      setError('Missing tattoo ID');
      return;
    }
    
    if (!about) {
      setError('Please provide a description for your tattoo work.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Fetch CSRF token
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();
      const authToken = getToken();
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
      
      // Create payload
      const payload = {
        title: title || 'Untitled Tattoo',
        about,
        styles: selectedStyles,
        tag_ids: selectedTags,
        user_id: user?.id
      };
      
      // Submit to API
      const response = await fetch(`/api/tattoos/${tattooId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update tattoo');
      }
      
      const responseData = await response.json();
      console.log('Tattoo updated successfully:', responseData);
      
      // Redirect to home page since we're using modals now
      router.push('/');
    } catch (error) {
      console.error('Error updating tattoo:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Add Tattoo Details | InkedIn</title>
        <meta name="description" content="Complete your tattoo upload by adding details" />
      </Head>

      <Box
        sx={{
          maxWidth: '800px',
          margin: '0 auto',
          p: { xs: 2, sm: 4 },
          my: 4
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px'
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 3,
              textAlign: 'center',
              color: colors.textPrimary,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 500
            }}
          >
            Add Tattoo Details
          </Typography>

          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: `${colors.error}1A`, color: colors.error, borderRadius: '8px', border: `1px solid ${colors.error}40` }}>
              {error}
            </Box>
          )}

          {/* Loading state */}
          {isLoading ? (
            <Box sx={{ mb: 4, textAlign: 'center', p: 4 }}>
              <CircularProgress sx={{ color: colors.accent }} />
              <Typography sx={{ mt: 2, color: colors.textSecondary }}>Loading tattoo data...</Typography>
            </Box>
          ) : (
            <>
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 ? (
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ mb: 2, fontWeight: 600, color: colors.textPrimary }}>
                    Your Uploaded Images
                  </Typography>
                  <Grid container spacing={2}>
                    {imagePreviewUrls.map((url, index) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                        <Box 
                          sx={{
                            aspectRatio: '1/1',
                            position: 'relative',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img 
                            src={url} 
                            alt={`Tattoo preview ${index + 1}`} 
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ mb: 4, p: 2, bgcolor: 'warning.light', color: 'warning.dark', borderRadius: 1 }}>
                  <Typography>No images found for this tattoo.</Typography>
                </Box>
              )}
            </>
          )}

          {!isLoading && (
            <form onSubmit={handleSubmit}>
              {/* Title (optional) */}
              <TextField
                label="Title (Optional)"
                fullWidth
                margin="normal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your tattoo work a title"
                disabled={isSubmitting}
              />
              
              {/* About (required) */}
              <TextField
                label="About"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                required
                placeholder="Describe the tattoo, techniques used, or any special meaning"
                sx={{ mb: 3 }}
                disabled={isSubmitting}
              />
              
              {/* Style selection */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: 600, color: colors.textPrimary }}>
                  Tattoo Styles
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => setStyleModalOpen(true)}
                  sx={{
                    mb: 1,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    '&:hover': { borderColor: colors.accent, color: colors.accent }
                  }}
                  disabled={isSubmitting}
                >
                  Select Styles
                </Button>

                {selectedStyles.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {selectedStyles.map(styleId => {
                      const style = styles.find(s => s.id === styleId);
                      return (
                        <Box
                          key={styleId}
                          sx={{
                            bgcolor: colors.accent,
                            color: colors.background,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}
                        >
                          {style?.name || 'Unknown Style'}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Tag selection */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: 600, color: colors.textPrimary }}>
                  Subject Tags
                </Typography>
                <Typography sx={{ mb: 1.5, fontSize: '0.85rem', color: colors.textSecondary }}>
                  Add tags to help people find your work (e.g., skull, rose, dragon)
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => setTagModalOpen(true)}
                  sx={{
                    mb: 1,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    '&:hover': { borderColor: colors.accent, color: colors.accent }
                  }}
                  disabled={isSubmitting}
                >
                  Select Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>

                {selectedTags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return (
                        <Box
                          key={tagId}
                          sx={{
                            bgcolor: colors.surface,
                            border: `1px solid ${colors.accent}`,
                            color: colors.accent,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}
                        >
                          {tag?.name || 'Unknown Tag'}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !about}
                  sx={{ bgcolor: colors.accent, '&:hover': { bgcolor: colors.accentDark } }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : 'Save Tattoo'}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
      
      {/* Style selection modal */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />

      {/* Tag selection modal */}
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onApply={handleApplyTags}
        selectedTags={selectedTags}
        maxTags={10}
      />
    </Layout>
  );
}