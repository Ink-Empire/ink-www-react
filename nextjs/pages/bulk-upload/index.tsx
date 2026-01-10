import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMediaQuery, useTheme } from '@mui/material';
import Layout from '@/components/Layout';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { useBulkUpload, BulkUpload } from '@/hooks/useBulkUpload';
import { colors } from '@/styles/colors';
import UploadDropzone from '@/components/BulkUpload/UploadDropzone';

export default function BulkUploadPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { listUploads, uploadZip, deleteUpload, loading } = useBulkUpload();

  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/bulk-upload');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load existing uploads
  const loadUploads = useCallback(async () => {
    try {
      const data = await listUploads();
      setUploads(data);
    } catch (err) {
      console.error('Failed to load uploads:', err);
    }
  }, [listUploads]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUploads();
    }
  }, [isAuthenticated, loadUploads]);

  const handleFileSelect = async (file: File, source: 'instagram' | 'manual') => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const upload = await uploadZip(file, source, (progress) => {
        setUploadProgress(progress);
      });

      // Redirect to the review page
      router.push(`/bulk-upload/${upload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this upload? This cannot be undone.')) {
      return;
    }

    try {
      await deleteUpload(id);
      setUploads(uploads.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scanning':
        return 'info';
      case 'cataloged':
        return 'warning';
      case 'processing':
        return 'info';
      case 'ready':
        return 'success';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scanning':
        return 'Scanning ZIP...';
      case 'cataloged':
        return 'Ready to Process';
      case 'processing':
        return 'Processing...';
      case 'ready':
        return 'Ready to Review';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusChipSx = (status: string) => {
    switch (status) {
      case 'scanning':
      case 'processing':
        return { bgcolor: colors.infoDim, color: colors.info, border: `1px solid ${colors.info}` };
      case 'cataloged':
        return { bgcolor: colors.warningDim, color: colors.warning, border: `1px solid ${colors.warning}` };
      case 'ready':
      case 'completed':
        return { bgcolor: colors.successDim, color: colors.success, border: `1px solid ${colors.success}` };
      case 'failed':
        return { bgcolor: `${colors.error}15`, color: colors.error, border: `1px solid ${colors.error}` };
      default:
        return { bgcolor: colors.background, color: colors.textSecondary, border: `1px solid ${colors.border}` };
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  // Mobile restriction
  if (isMobile) {
    return (
      <Layout>
        <Head>
          <title>Bulk Upload | InkedIn</title>
        </Head>
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 8, px: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <DesktopWindowsIcon sx={{ fontSize: 40, color: colors.accent }} />
          </Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: colors.textPrimary }}>
            Desktop Required
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: colors.textSecondary, lineHeight: 1.7 }}>
            Bulk upload is designed for larger screens and works best on a desktop or laptop computer.
            Please visit this page from a desktop browser to upload your images.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/dashboard')}
            sx={{
              bgcolor: colors.accent,
              color: colors.background,
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Bulk Upload | InkedIn</title>
      </Head>

      <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: colors.textPrimary }}>
          Bulk Upload
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: colors.textSecondary }}>
          Import your tattoo portfolio from Instagram or upload a ZIP of images
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
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

        {/* Upload Section */}
        {uploading ? (
          <Card sx={{ mb: 4, bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={48} sx={{ mb: 2, color: colors.accent }} />
              <Typography variant="h6" sx={{ mb: 2, color: colors.textPrimary }}>
                Uploading...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  maxWidth: 400,
                  mx: 'auto',
                  mb: 1,
                  bgcolor: colors.background,
                  '& .MuiLinearProgress-bar': { bgcolor: colors.accent },
                }}
              />
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {uploadProgress}% complete
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <UploadDropzone onFileSelect={handleFileSelect} />
        )}

        {/* Existing Uploads */}
        {uploads.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: colors.textPrimary }}>
              Your Uploads
            </Typography>

            {uploads.map((upload) => (
              <Card key={upload.id} sx={{ mb: 2, bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: upload.source === 'instagram' ? '#E1306C' : colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {upload.source === 'instagram' ? (
                        <InstagramIcon sx={{ color: 'white' }} />
                      ) : (
                        <FolderZipIcon sx={{ color: 'white' }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: colors.textPrimary }}>
                        {upload.original_filename || 'Bulk Upload'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={getStatusLabel(upload.status)}
                          size="small"
                          sx={getStatusChipSx(upload.status)}
                        />
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          {upload.cataloged_images} images found
                        </Typography>
                        {upload.processed_images > 0 && (
                          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                            &bull; {upload.processed_images} processed
                          </Typography>
                        )}
                        {upload.published_images > 0 && (
                          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                            &bull; {upload.published_images} published
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {upload.status !== 'failed' && upload.status !== 'completed' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => router.push(`/bulk-upload/${upload.id}`)}
                          sx={{
                            bgcolor: colors.accent,
                            color: colors.background,
                            '&:hover': { bgcolor: colors.accentHover },
                          }}
                        >
                          {upload.status === 'scanning' ? 'View Progress' : 'Continue'}
                        </Button>
                      )}
                      {upload.status === 'completed' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => router.push(`/bulk-upload/${upload.id}`)}
                          sx={{
                            color: colors.textSecondary,
                            borderColor: colors.border,
                            '&:hover': { borderColor: colors.textSecondary, bgcolor: colors.background },
                          }}
                        >
                          View
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(upload.id)}
                        sx={{ color: colors.error }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {upload.error_message && (
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2,
                        bgcolor: `${colors.error}15`,
                        color: colors.error,
                        border: `1px solid ${colors.error}`,
                      }}
                    >
                      {upload.error_message}
                    </Alert>
                  )}

                  {(upload.status === 'cataloged' || upload.status === 'ready') && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(upload.processed_images / upload.cataloged_images) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: colors.background,
                          '& .MuiLinearProgress-bar': { bgcolor: colors.accent },
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: colors.textSecondary }}>
                        {upload.processed_images} of {upload.cataloged_images} images processed
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Help Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" sx={{ mb: 2, color: colors.textPrimary }}>
            How it works
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
              <CardContent>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: colors.accent,
                    color: colors.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  1
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: colors.textPrimary }}>
                  Upload your ZIP
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Upload your Instagram data export or a ZIP file containing your tattoo images.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
              <CardContent>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: colors.accent,
                    color: colors.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  2
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: colors.textPrimary }}>
                  Review & Tag
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Process images in batches of 200. Add styles, placements, and approve AI-suggested tags.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
              <CardContent>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: colors.accent,
                    color: colors.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  3
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: colors.textPrimary }}>
                  Publish
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Publish your tattoos to your portfolio. They'll be indexed and searchable instantly.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
