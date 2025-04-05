import React, { useState, useEffect, useRef } from 'react';
import { useStyles } from '@/contexts/StyleContext';

// MUI Material imports
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

// MUI Icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginBottom: theme.spacing(2),
  width: '100%',
  border: `1px solid #e8dbc5`,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: theme.shadows[3],
  borderRadius: 0,
}));

const StylesContainer = styled(Box)(({ theme }) => ({
  maxHeight: 200,
  overflow: 'auto',
  padding: theme.spacing(1),
  border: `1px solid #e8dbc5`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

interface SearchFiltersProps {
  initialFilters?: {
    searchString?: string;
    styles?: number[];
    distance?: number;
  };
  onFilterChange: (filters: {
    searchString: string;
    styles: number[];
    distance: number;
  }) => void;
  type: 'artists' | 'tattoos';
  onSidebarToggle?: (isExpanded: boolean) => void;
  initialExpanded?: boolean;
  isLoading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  initialFilters = {},
  onFilterChange,
  type,
  onSidebarToggle,
  initialExpanded = true,
  isLoading = false
}) => {
  // Get styles from context
  const { styles, loading: stylesLoading } = useStyles();

  // Filter states
  const [searchString, setSearchString] = useState(initialFilters.searchString || '');
  const [selectedStyles, setSelectedStyles] = useState<number[]>(initialFilters.styles || []);
  const [distance, setDistance] = useState<number>(initialFilters.distance || 50);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Debounce search with timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Distance options in miles
  const distanceOptions = [25, 50, 75, 100];

  // Apply filters when component mounts if initial filters are provided
  useEffect(() => {
    if (initialFilters.searchString || initialFilters.styles?.length || initialFilters.distance) {
      handleApplyFilters();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Handle search string change with debounce (500ms)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchString = e.target.value;
    setSearchString(newSearchString);
    
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Set a new timer to apply the filter after typing stops
    searchTimerRef.current = setTimeout(() => {
      onFilterChange({
        searchString: newSearchString,
        styles: selectedStyles,
        distance
      });
    }, 500);
  };

  // Handle style checkbox change
  const handleStyleChange = (styleId: number) => {
    // Create new styles array first
    const newStyles = selectedStyles.includes(styleId)
      ? selectedStyles.filter(id => id !== styleId)
      : [...selectedStyles, styleId];
    
    // Update state
    setSelectedStyles(newStyles);
    
    // Immediately trigger search with updated styles
    onFilterChange({
      searchString,
      styles: newStyles,
      distance
    });
  };

  // Handle distance change
  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistance = Number(e.target.value);
    setDistance(newDistance);
    
    // Immediately apply filter with new distance
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance: newDistance
    });
  };

  // Apply all filters
  const handleApplyFilters = () => {
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchString('');
    setSelectedStyles([]);
    setDistance(50);
    
    onFilterChange({
      searchString: '',
      styles: [],
      distance: 50
    });
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Notify parent component if callback exists
    if (onSidebarToggle) {
      onSidebarToggle(newExpandedState);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <CircularProgress color="primary" size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading {type}...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Sidebar */}
      <FilterPaper
        sx={{
          position: 'fixed',
          left: 0,
          top: '96px',
          height: 'calc(100% - 96px)',
          width: isExpanded ? '260px' : '40px',
          transition: 'width 0.3s ease',
          zIndex: 10
        }}
      >
        {/* Toggle button */}
        <IconButton
          onClick={toggleSidebar}
          aria-label={isExpanded ? 'Collapse filter sidebar' : 'Expand filter sidebar'}
          sx={{
            position: 'absolute',
            right: -5,
            top: '20px',
            transform: 'translateX(50%)',
            backgroundColor: 'secondary.main',
             color: 'white',
            '&:hover': {
              backgroundColor: 'secondary.dark',
            },
            width: 32,
            height: 32,
            boxShadow: 2,
            zIndex: 2
          }}
        >
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        {/* Filter content - only show when expanded */}
        {isExpanded && (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Search input */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Search
              </Typography>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder={type === 'artists' ? "Artist name or studio" : "Tattoo description or tags"}
                  value={searchString}
                  onChange={handleSearchChange}
                  inputProps={{ 'aria-label': 'search' }}
                  endAdornment={
                    searchString ? (
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSearchString('');
                          onFilterChange({
                            searchString: '',
                            styles: selectedStyles,
                            distance
                          });
                        }}
                        sx={{ mr: 1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
              </Search>
            </Box>

            {/* Distance selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Distance (miles)
              </Typography>
              <FormControl fullWidth variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8dbc5' } }}>
                <Select
                  value={distance}
                  onChange={handleDistanceChange}
                  displayEmpty
                  sx={{ borderColor: '#e8dbc5' }}
                >
                  {distanceOptions.map(option => (
                    <MenuItem key={option} value={option}>{option} miles</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Styles */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Styles
              </Typography>
              <StylesContainer>
                {stylesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {styles.map(style => (
                      <FormControlLabel
                        key={style.id}
                        control={
                          <Checkbox 
                            checked={selectedStyles.includes(style.id)} 
                            onChange={() => handleStyleChange(style.id)}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">{style.name}</Typography>
                        }
                      />
                    ))}
                  </Box>
                )}
              </StylesContainer>
            </Box>
            
            {/* Filter buttons */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}
      </FilterPaper>
    </>
  );
};

export default SearchFilters;