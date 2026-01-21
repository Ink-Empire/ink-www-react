// TODO: Add multi-select mode that allows users to select multiple images and group them
// into a carousel post. Instagram exports don't preserve carousel grouping, so users
// need a way to manually group related images together.

import React from 'react';
import {
  Box,
  Typography,
  Pagination,
  Chip,
  Skeleton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import CollectionsIcon from '@mui/icons-material/Collections';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { BulkUploadItem, ItemsResponse } from '@/hooks/useBulkUpload';
import { colors } from '@/styles/colors';

interface ThumbnailGridProps {
  items: BulkUploadItem[];
  meta: ItemsResponse['meta'] | null;
  onItemClick: (item: BulkUploadItem) => void;
  onPageChange: (page: number) => void;
}

export default function ThumbnailGrid({
  items,
  meta,
  onItemClick,
  onPageChange,
}: ThumbnailGridProps) {
  // Check if an edited item is missing required details
  const isMissingDetails = (item: BulkUploadItem): boolean => {
    // Only show warning for items that have been edited by the user
    if (!item.is_edited || item.is_skipped || item.is_ready_for_publish || item.is_published) {
      return false;
    }
    // Required fields: placement and primary style
    return !item.placement_id || !item.primary_style_id;
  };

  const getStatusOverlay = (item: BulkUploadItem) => {
    if (item.is_published) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: colors.success,
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      );
    }
    if (item.is_skipped) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: colors.textMuted,
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
          }}
        >
          <BlockIcon sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      );
    }
    if (item.is_ready_for_publish) {
      return (
        <Chip
          label="Ready"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: colors.success,
            color: 'white',
            fontSize: '0.65rem',
            height: 20,
          }}
        />
      );
    }
    // Show warning for processed items missing required details
    if (isMissingDetails(item)) {
      return (
        <Tooltip title="Missing details" arrow placement="top">
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: colors.error,
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 16, color: 'white' }} />
          </Box>
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            onClick={() => onItemClick(item)}
            sx={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              bgcolor: colors.surface,
              border: item.is_ready_for_publish ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                borderColor: colors.accent,
              },
              opacity: item.is_skipped ? 0.5 : 1,
            }}
          >
            {item.thumbnail_url ? (
              <Box
                component="img"
                src={item.thumbnail_url}
                alt={item.filename}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: colors.background,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={24} sx={{ color: colors.accent }} />
                <Typography variant="caption" sx={{ color: colors.textMuted, fontSize: '0.65rem' }}>
                  Processing...
                </Typography>
              </Box>
            )}

            {/* Status overlay */}
            {getStatusOverlay(item)}

            {/* Carousel indicator */}
            {item.group_count > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  borderRadius: 1,
                  px: 0.75,
                  py: 0.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <CollectionsIcon sx={{ fontSize: 14, color: 'white' }} />
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                  {item.group_count}
                </Typography>
              </Box>
            )}

            {/* Style chip */}
            {item.primary_style && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {item.primary_style.name}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={meta.last_page}
            page={meta.current_page}
            onChange={(_, page) => onPageChange(page)}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: colors.textSecondary,
                borderColor: colors.border,
                '&:hover': {
                  bgcolor: colors.background,
                },
                '&.Mui-selected': {
                  bgcolor: colors.accent,
                  color: colors.background,
                  '&:hover': {
                    bgcolor: colors.accentHover,
                  },
                },
              },
            }}
          />
        </Box>
      )}

      {/* Results info */}
      {meta && (
        <Typography
          variant="body2"
          sx={{ textAlign: 'center', mt: 2, color: colors.textSecondary }}
        >
          Showing {items.length} of {meta.total} images
        </Typography>
      )}
    </Box>
  );
}
