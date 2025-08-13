import React from 'react';
import { styled } from '@mui/material/styles';
import {
  Paper,
  IconButton,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { SearchFiltersContent } from './SearchFiltersContent';
import { SearchFiltersUIProps } from './types';

const FilterPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: theme.shadows[3],
  borderRadius: 0,
}));

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
    <FilterPaper
      sx={{
        position: 'fixed',
        left: 0,
        top: '96px',
        height: 'calc(100vh - 96px)',
        width: isExpanded ? '280px' : '48px',
        transition: 'width 0.3s ease',
        zIndex: 10,
        backgroundColor: '#2a1a1e',
        border: '1px solid rgba(232, 219, 197, 0.1)',
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
          backgroundColor: '#339989',
          color: 'white',
          '&:hover': {
            backgroundColor: '#2a7f7a',
          },
          width: 32,
          height: 32,
          boxShadow: 2,
          zIndex: 11
        }}
      >
        {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>

      {/* Filter content - only show when expanded */}
      {isExpanded && <SearchFiltersContent {...contentProps} />}
    </FilterPaper>
  );
};