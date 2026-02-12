import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import PublishIcon from '@mui/icons-material/Publish';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useBulkUpload, BulkUpload, BulkUploadItem, ItemsResponse } from '@/hooks/useBulkUpload';
import { colors } from '@/styles/colors';
import BatchProgress from '@/components/BulkUpload/BatchProgress';
import ThumbnailGrid from '@/components/BulkUpload/ThumbnailGrid';
import ItemDetailModal from '@/components/BulkUpload/ItemDetailModal';

type FilterType = 'all' | 'unprocessed' | 'processed' | 'ready' | 'published' | 'skipped';

export default function BulkUploadReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showConfirm } = useDialog();
  const {
    getUpload,
    getItems,
    updateItem,
    processBatch,
    publish,
    getPublishStatus,
    loading,
  } = useBulkUpload();

  const [upload, setUpload] = useState<BulkUpload | null>(null);
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [meta, setMeta] = useState<ItemsResponse['meta'] | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<BulkUploadItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });
  const [publishSuccess, setPublishSuccess] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/bulk-upload');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load upload data
  const loadUpload = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getUpload(Number(id));
      setUpload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upload');
    }
  }, [id, getUpload]);

  // Load items
  const loadItems = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getItems(Number(id), {
        filter,
        page,
        perPage: 24,
        primaryOnly: true,
      });
      setItems(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  }, [id, filter, page, getItems]);

  useEffect(() => {
    if (isAuthenticated && id) {
      loadUpload();
      loadItems();
    }
  }, [isAuthenticated, id, loadUpload, loadItems]);

  // Refs to hold latest callback functions to avoid stale closures in interval
  const loadUploadRef = useRef(loadUpload);
  const loadItemsRef = useRef(loadItems);
  useEffect(() => {
    loadUploadRef.current = loadUpload;
    loadItemsRef.current = loadItems;
  }, [loadUpload, loadItems]);

  // Auto-refresh while processing
  useEffect(() => {
    const isProcessing = upload?.status === 'scanning' || upload?.status === 'processing';
    // Statuses that indicate processing is complete
    const completedStatuses = ['failed', 'completed', 'ready', 'incomplete'];
    const isComplete = upload?.status && completedStatuses.includes(upload.status);
    // Only poll if we need items and upload isn't in a final state
    const needsItemRefresh = upload && items.length === 0 && !isComplete;

    if (isProcessing || needsItemRefresh) {
      const interval = setInterval(() => {
        loadUploadRef.current();
        loadItemsRef.current();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [upload?.status, items.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUpload(), loadItems()]);
    setRefreshing(false);
  };

  const handleProcessBatch = async () => {
    if (!upload) return;
    setProcessing(true);
    setError(null);
    try {
      await processBatch(upload.id, 200);
      // Start polling for updates
      setTimeout(() => {
        loadUpload();
        loadItems();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!upload) return;
    const count = upload.ready_count;
    const confirmed = await showConfirm(`Publish ${count} tattoo${count !== 1 ? 's' : ''} to your portfolio?`, 'Publish Tattoos');
    if (!confirmed) return;

    setPublishing(true);
    setError(null);
    setPublishSuccess(null);

    try {
      const result = await publish(upload.id);
      const publishedCount = result.count || count;

      setSnackbar({
        open: true,
        message: `Publishing ${publishedCount} tattoo${publishedCount !== 1 ? 's' : ''}...`,
        type: 'success',
      });

      // Poll until publish job completes (ready_count changes)
      const originalReadyCount = upload.ready_count;
      const pollForCompletion = async (attempts = 0): Promise<void> => {
        if (attempts > 15) return;

        await new Promise(resolve => setTimeout(resolve, 2000));

        const currentUpload = await getUpload(Number(id));
        if (currentUpload.ready_count !== originalReadyCount ||
            currentUpload.status === 'completed' ||
            currentUpload.status === 'incomplete') {
          await loadUpload();
          await loadItems();
          return;
        }

        await pollForCompletion(attempts + 1);
      };

      await pollForCompletion();
      setPublishSuccess(publishedCount);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Publishing failed',
        type: 'error',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleItemClick = (item: BulkUploadItem) => {
    setSelectedItem(item);
  };

  const handleSkipItem = async (item: BulkUploadItem) => {
    if (!upload) return;
    try {
      await updateItem(upload.id, item.id, { is_skipped: true });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      loadUpload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip item');
    }
  };

  const handleItemUpdate = async (itemId: number, data: any) => {
    if (!upload) return;
    try {
      const updated = await updateItem(upload.id, itemId, data);
      setItems(items.map((i) => (i.id === itemId ? updated : i)));
      if (selectedItem?.id === itemId) {
        setSelectedItem(updated);
      }
      // Refresh counts
      loadUpload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleNextItem = () => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((i) => i.id === selectedItem.id);
    if (currentIndex < items.length - 1) {
      setSelectedItem(items[currentIndex + 1]);
    }
  };

  const handlePrevItem = () => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((i) => i.id === selectedItem.id);
    if (currentIndex > 0) {
      setSelectedItem(items[currentIndex - 1]);
    }
  };

  if (authLoading || !upload) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Review Upload | InkedIn</title>
      </Head>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => router.push('/bulk-upload')} sx={{ color: colors.textSecondary }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.textPrimary }}>
              {upload.original_filename || 'Bulk Upload'}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              {upload.cataloged_images} images found
              {upload.source === 'instagram' && ' from Instagram export'}
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: colors.textSecondary }}>
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Box>

        {publishSuccess !== null && (
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: `${colors.success}15`,
              border: `2px solid ${colors.success}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 36, color: colors.success }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.success }}>
                {publishSuccess} tattoo{publishSuccess !== 1 ? 's' : ''} published!
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Your tattoos are now live on your portfolio.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard')}
              sx={{
                borderColor: colors.success,
                color: colors.success,
                '&:hover': { bgcolor: `${colors.success}15`, borderColor: colors.success },
              }}
            >
              View Portfolio
            </Button>
            <IconButton
              onClick={() => setPublishSuccess(null)}
              sx={{ color: colors.textMuted }}
            >
              <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>&#x2715;</Box>
            </IconButton>
          </Box>
        )}

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

        {/* Progress Section */}
        <BatchProgress
          upload={upload}
          onProcessBatch={handleProcessBatch}
          onPublish={handlePublish}
          processing={processing}
          publishing={publishing}
        />

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${colors.border}`, mb: 3, mt: 4 }}>
          <Tabs
            value={filter}
            onChange={(_, value) => {
              setFilter(value);
              setPage(1);
            }}
            sx={{
              '& .MuiTab-root': {
                color: colors.textSecondary,
                textTransform: 'none',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: colors.accent,
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: colors.accent,
              },
            }}
          >
            <Tab label={`All (${upload.cataloged_images})`} value="all" />
            <Tab label={`Unprocessed (${upload.unprocessed_count})`} value="unprocessed" />
            <Tab label={`Processed (${upload.processed_images})`} value="processed" />
            <Tab label={`Ready (${upload.ready_count})`} value="ready" />
            <Tab label={`Published (${upload.published_images})`} value="published" />
          </Tabs>
        </Box>

        {/* Thumbnail Grid */}
        {items.length > 0 ? (
          <ThumbnailGrid
            items={items}
            meta={meta}
            onItemClick={handleItemClick}
            onPageChange={setPage}
            onSkipItem={handleSkipItem}
          />
        ) : (upload?.status === 'scanning' || upload?.status === 'processing') ? (
          <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={48} sx={{ color: colors.accent, mb: 3 }} />
              <Typography variant="h6" sx={{ color: colors.textPrimary, mb: 1 }}>
                {upload?.status === 'scanning' ? 'Scanning ZIP file...' : 'Processing images...'}
              </Typography>
              <Typography sx={{ color: colors.textSecondary }}>
                {upload?.status === 'scanning'
                  ? 'Finding images in your upload. This may take a moment.'
                  : `Processing ${upload?.processed_images || 0} of ${upload?.total_images || 0} images...`}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: colors.textSecondary }}>
                {filter === 'unprocessed'
                  ? 'All images have been processed!'
                  : filter === 'processed'
                  ? 'No processed images yet. Click "Process Next 200" to start.'
                  : filter === 'ready'
                  ? 'No images ready to publish. Add styles and tags to your processed images.'
                  : filter === 'published'
                  ? 'No images published yet.'
                  : 'No images found.'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            onClose={handleCloseModal}
            onUpdate={handleItemUpdate}
            onNext={handleNextItem}
            onPrev={handlePrevItem}
            hasNext={items.findIndex((i) => i.id === selectedItem.id) < items.length - 1}
            hasPrev={items.findIndex((i) => i.id === selectedItem.id) > 0}
          />
        )}
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.type}
          sx={{
            bgcolor: snackbar.type === 'success' ? colors.success : colors.error,
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' },
            '& .MuiAlert-action': { color: '#fff' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Layout>
  );
}
