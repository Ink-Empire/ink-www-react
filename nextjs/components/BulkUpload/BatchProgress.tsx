import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BulkUpload } from '@/hooks/useBulkUpload';
import { colors } from '@/styles/colors';

interface BatchProgressProps {
  upload: BulkUpload;
  onProcessBatch: () => void;
  onPublish: () => void;
  processing: boolean;
  publishing: boolean;
}

export default function BatchProgress({
  upload,
  onProcessBatch,
  onPublish,
  processing,
  publishing,
}: BatchProgressProps) {
  const processedPercent = upload.cataloged_images > 0
    ? (upload.processed_images / upload.cataloged_images) * 100
    : 0;

  const getStatusChip = () => {
    switch (upload.status) {
      case 'scanning':
        return (
          <Chip
            label="Scanning ZIP..."
            size="small"
            sx={{ bgcolor: colors.infoDim, color: colors.info, border: `1px solid ${colors.info}` }}
          />
        );
      case 'cataloged':
        return (
          <Chip
            label="Ready to Process"
            size="small"
            sx={{ bgcolor: colors.warningDim, color: colors.warning, border: `1px solid ${colors.warning}` }}
          />
        );
      case 'processing':
        return (
          <Chip
            label="Processing images..."
            size="small"
            sx={{
              bgcolor: colors.infoDim,
              color: colors.info,
              border: `1px solid ${colors.info}`,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              },
            }}
          />
        );
      case 'ready':
        return (
          <Chip
            label="Ready to Review"
            size="small"
            sx={{ bgcolor: colors.successDim, color: colors.success, border: `1px solid ${colors.success}` }}
          />
        );
      case 'completed':
        return (
          <Chip
            label="Completed"
            size="small"
            icon={<CheckCircleIcon sx={{ color: `${colors.success} !important` }} />}
            sx={{ bgcolor: colors.successDim, color: colors.success, border: `1px solid ${colors.success}` }}
          />
        );
      case 'incomplete':
        return (
          <Chip
            label="Incomplete"
            size="small"
            sx={{ bgcolor: colors.warningDim, color: colors.warning, border: `1px solid ${colors.warning}` }}
          />
        );
      case 'failed':
        return (
          <Chip
            label="Failed"
            size="small"
            sx={{ bgcolor: `${colors.error}15`, color: colors.error, border: `1px solid ${colors.error}` }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ flex: 1, color: colors.textPrimary, fontWeight: 600 }}>
            Processing Progress
          </Typography>
          {getStatusChip()}
        </Box>

        {/* Processing Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Processed
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: colors.textPrimary }}>
              {upload.processed_images} / {upload.cataloged_images}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={processedPercent}
            sx={{
              height: 10,
              borderRadius: 1,
              bgcolor: colors.background,
              '& .MuiLinearProgress-bar': {
                bgcolor: colors.accent,
              },
            }}
          />
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: colors.background,
            borderRadius: 1,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.textMuted }}>
              {upload.unprocessed_count}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Unprocessed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.accent }}>
              {upload.processed_images}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Processed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.success }}>
              {upload.ready_count}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Ready to Publish
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.info }}>
              {upload.published_images}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Published
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {upload.can_process && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={onProcessBatch}
              disabled={processing || upload.status === 'processing'}
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
              }}
            >
              {processing || upload.status === 'processing'
                ? 'Processing...'
                : `Process Next ${Math.min(200, upload.unprocessed_count)}`}
            </Button>
          )}

          {upload.can_publish && upload.ready_count > 0 && (
            <Button
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={onPublish}
              disabled={publishing}
              sx={{
                bgcolor: colors.success,
                color: '#fff',
                '&:hover': { bgcolor: '#3d8269' },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
              }}
            >
              {publishing ? 'Publishing...' : `Publish ${upload.ready_count} Tattoos`}
            </Button>
          )}

          {upload.status === 'completed' && (
            <Typography variant="body2" sx={{ color: colors.success, alignSelf: 'center' }}>
              All images have been published!
            </Typography>
          )}

          {upload.status === 'incomplete' && upload.ready_count === 0 && (
            <Typography variant="body2" sx={{ color: colors.warning, alignSelf: 'center' }}>
              Add styles and tags to more images to continue publishing.
            </Typography>
          )}
        </Box>

        {/* Processing Status Message */}
        {upload.status === 'processing' && (
          <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: colors.background,
            borderRadius: 1,
            border: `1px solid ${colors.info}`,
          }}>
            <Typography variant="body2" sx={{ color: colors.info }}>
              Extracting images and generating thumbnails in batches of 25.
              This page updates automatically - thumbnails will appear as they're processed.
            </Typography>
          </Box>
        )}

        {/* Help Text */}
        {upload.can_process && upload.unprocessed_count > 200 && upload.status !== 'processing' && (
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: colors.textMuted }}>
            Processing in batches of 200 to manage resources. You have {upload.unprocessed_count} images remaining.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
