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
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { SearchFiltersContent } from './SearchFiltersContent';
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
          <ArrowForwardIcon />
        </IconButton>

        <Box sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
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
      </Drawer>
    </>
  );
};