import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { SearchFiltersContent } from './SearchFiltersContent';
import { GuidedSearchHelper } from './GuidedSearchHelper';
import { SearchFiltersUIProps } from './types';

interface MobileSearchFiltersUIProps extends SearchFiltersUIProps {
  isExpanded: boolean;
  onToggleSidebar: () => void;
}

export const MobileSearchFiltersUI: React.FC<MobileSearchFiltersUIProps> = ({
  isExpanded,
  onToggleSidebar,
  ...contentProps
}) => {
  return (
    <>
      {/* Mobile: Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="open filters"
        onClick={onToggleSidebar}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <MenuIcon />
      </Fab>

      {/* Mobile: Drawer */}
      <Drawer
        anchor="right"
        open={isExpanded}
        onClose={onToggleSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: '85vw',
            maxWidth: 400,
            bgcolor: 'background.paper',
            position: 'relative'
          }
        }}
      >
        {/* Prominent Close Button - Top Right */}
        <IconButton
          onClick={onToggleSidebar}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: 'secondary.main', // Same as hamburger FAB and Apply Filters button
            color: 'white',
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'secondary.dark',
            },
            boxShadow: 2,
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
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

          <Box sx={{ p: 2, flex: 1 }}>
            {/* Header for mobile drawer */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              pb: 1,
              borderBottom: 1,
              borderColor: 'divider',
              pr: 6 // Add padding to avoid overlap with close button
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
            </Box>

            <SearchFiltersContent {...contentProps} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};