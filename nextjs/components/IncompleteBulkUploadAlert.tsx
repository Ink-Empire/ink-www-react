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
        // Find first incomplete upload (not completed, not failed)
        const incomplete = uploads.find(
          (u) => u.status !== 'completed' && u.status !== 'failed'
        );
        setIncompleteUpload(incomplete || null);
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
    const { status, unprocessed_count, ready_count, processed_images, total_images } = incompleteUpload;

    if (status === 'scanning') {
      return 'Your bulk upload is being scanned';
    }

    if (status === 'processing' || unprocessed_count > 0) {
      return `Processing images (${processed_images}/${total_images})`;
    }

    if (ready_count > 0) {
      return `${ready_count} tattoo${ready_count !== 1 ? 's' : ''} ready to publish`;
    }

    // Processed but nothing ready - need to add styles/placements
    if (processed_images > 0) {
      return `${processed_images} images need review`;
    }

    return 'You have an incomplete bulk upload';
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
          href={`/bulk-upload/${incompleteUpload.id}`}
          style={{ color: colors.warning, textDecoration: 'underline' }}
        >
          Continue where you left off
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
