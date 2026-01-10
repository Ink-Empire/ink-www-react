import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useBulkUpload, BulkUpload } from '@/hooks/useBulkUpload';
import { colors } from '@/styles/colors';

export default function IncompleteBulkUploadAlert() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { listUploads } = useBulkUpload();
  const [incompleteUpload, setIncompleteUpload] = useState<BulkUpload | null>(null);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only check for artists
    if (!isAuthenticated || !user || user.type !== 'artist') {
      setChecked(true);
      return;
    }

    // Check if user dismissed for this session
    const dismissedKey = 'bulk_upload_alert_dismissed';
    if (typeof window !== 'undefined' && sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
      setChecked(true);
      return;
    }

    const checkUploads = async () => {
      try {
        const uploads = await listUploads();
        // Find incomplete uploads (not completed, not failed, not deleting)
        const incompleteUploads = uploads.filter(
          (u) => u.status !== 'completed' && u.status !== 'failed' && u.status !== 'deleting'
        );
        setIncompleteCount(incompleteUploads.length);
        setIncompleteUpload(incompleteUploads[0] || null);
      } catch (err) {
        // Silently fail - this is a non-critical feature
        console.error('Failed to check bulk uploads:', err);
      } finally {
        setChecked(true);
      }
    };

    checkUploads();
  }, [isAuthenticated, user, listUploads]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bulk_upload_alert_dismissed', 'true');
    }
  };

  // Don't render until we've checked, or if already on bulk-upload page
  if (!checked || dismissed || !incompleteUpload || router.pathname.startsWith('/bulk-upload')) {
    return null;
  }

  const getStatusMessage = () => {
    if (!incompleteUpload) return '';

    // If multiple incomplete uploads, show generic message
    if (incompleteCount > 1) {
      return `You have ${incompleteCount} bulk uploads in progress`;
    }

    const { status, ready_count, processed_images, total_images, cataloged_images, published_images } = incompleteUpload;

    if (status === 'scanning') {
      return 'Scanning your ZIP file for images...';
    }

    if (status === 'cataloged') {
      return `Found ${cataloged_images} images - ready to add styles and tags`;
    }

    if (status === 'processing') {
      return `Processing images (${processed_images}/${total_images})...`;
    }

    if (status === 'incomplete') {
      const remaining = cataloged_images - published_images;
      return `${published_images} published, ${remaining} remaining`;
    }

    if (status === 'ready' && ready_count > 0) {
      return `${ready_count} tattoo${ready_count !== 1 ? 's' : ''} ready to publish!`;
    }

    // Processed but nothing ready - need to add styles/placements
    if (processed_images > 0 && ready_count === 0) {
      return `${processed_images} images need styles and tags before publishing`;
    }

    return 'You have an incomplete bulk upload';
  };

  const getLinkHref = () => {
    // If multiple uploads, go to the list page
    if (incompleteCount > 1) {
      return '/bulk-upload';
    }
    // If scanning or processing, go to the list page to see progress
    if (incompleteUpload?.status === 'scanning' || incompleteUpload?.status === 'processing') {
      return '/bulk-upload';
    }
    // Otherwise go directly to the upload
    return `/bulk-upload/${incompleteUpload?.id}`;
  };

  const getLinkText = () => {
    if (incompleteCount > 1) {
      return 'View all';
    }
    if (incompleteUpload?.status === 'scanning' || incompleteUpload?.status === 'processing') {
      return 'View progress';
    }
    if (incompleteUpload?.status === 'ready') {
      return 'Review and publish';
    }
    return 'Continue';
  };

  return (
    <Box
      sx={{
        bgcolor: colors.warningDim,
        border: `1px solid ${colors.warning}`,
        borderRadius: 2,
        color: colors.textPrimary,
        py: 1.5,
        px: 3,
        mx: 2,
        mt: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        position: 'relative',
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 22, color: colors.warning }} />
      <Typography variant="body1" sx={{ color: colors.textSecondary }}>
        {getStatusMessage()} -{' '}
        <Link
          href={getLinkHref()}
          style={{ color: colors.warning, textDecoration: 'underline' }}
        >
          {getLinkText()}
        </Link>
      </Typography>
      <IconButton
        size="small"
        onClick={handleDismiss}
        sx={{
          position: 'absolute',
          right: 12,
          color: colors.textMuted,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
