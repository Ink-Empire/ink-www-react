import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SearchFiltersContent } from './SearchFiltersContent';
import { GuidedSearchHelper } from './GuidedSearchHelper';
import { SearchFiltersUIProps } from './types';
import { colors } from '@/styles/colors';

interface DesktopSearchFiltersUIProps extends SearchFiltersUIProps {
  isExpanded: boolean;
  onToggleSidebar: () => void;
}

export const DesktopSearchFiltersUI: React.FC<DesktopSearchFiltersUIProps> = ({
  isExpanded,
  onToggleSidebar,
  ...contentProps
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: '64px',
        height: 'calc(100vh - 64px)',
        width: isExpanded ? '320px' : '48px',
        transition: 'width 0.3s ease, transform 0.3s ease',
        zIndex: 10,
        bgcolor: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Toggle button */}
      <IconButton
        onClick={onToggleSidebar}
        aria-label={isExpanded ? 'Collapse filter sidebar' : 'Expand filter sidebar'}
        sx={{
          position: 'absolute',
          right: -16,
          top: '20px',
          bgcolor: colors.accent,
          color: colors.background,
          '&:hover': { bgcolor: colors.accentHover },
          width: 32,
          height: 32,
          boxShadow: 2,
          zIndex: 11
        }}
      >
        {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>

      {/* Sidebar content - only show when expanded */}
      {isExpanded && (
        <>
          {/* Guided Search Helper */}
          <GuidedSearchHelper
            onLocationChange={(locationType, customLocation, coords) => {
              // Immediately update location filters as user progresses through guided search
              if (locationType === 'anywhere') {
                contentProps.onLocationOptionChange('any');
              } else if (locationType === 'near_me') {
                contentProps.onLocationOptionChange('my');
              } else if (locationType === 'custom' && customLocation) {
                contentProps.onLocationOptionChange('custom');
                contentProps.onLocationSelect(customLocation, coords);
              }
            }}
            onApplyFilters={(data) => {
              // Apply all guided search params at once to avoid race conditions
              contentProps.onGuidedSearchApply({
                searchText: data.searchText,
                locationType: data.locationType,
                customLocation: data.customLocation,
                locationCoords: data.locationCoords
              });
            }}
          />

          {/* Sidebar Header */}
          <Box sx={{
            p: '1.25rem 1.25rem 1rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: colors.textPrimary
            }}>
              Filters
            </Typography>
            <Box
              component="button"
              onClick={contentProps.onClearFilters}
              sx={{
                fontSize: '0.8rem',
                color: colors.accent,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Clear all
            </Box>
          </Box>

          {/* Sidebar Content */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: '1rem 1.25rem',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: colors.background,
              borderRadius: 3
            }
          }}>
            <SearchFiltersContent {...contentProps} />
          </Box>
        </>
      )}
    </Box>
  );
};
