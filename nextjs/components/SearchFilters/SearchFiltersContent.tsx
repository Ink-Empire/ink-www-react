import React from 'react';
import { styled, alpha } from '@mui/material/styles';
import {
  Box,
  Typography,
  InputBase,
  MenuItem,
  FormControl,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  TextField,
  FormControlLabel,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useStyles } from '@/contexts/StyleContext';
import { useUserData } from '@/contexts/UserContext';
import { SearchFiltersUIProps } from './types';

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

const StylesContainer = styled(Box)(({ theme }) => ({
  maxHeight: 200,
  overflow: 'auto',
  padding: theme.spacing(1),
  border: `1px solid #e8dbc5`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

export const SearchFiltersContent: React.FC<SearchFiltersUIProps> = ({
  type,
  searchString,
  selectedStyles,
  distance,
  distanceUnit,
  useMyLocation,
  useAnyLocation,
  applySavedStyles,
  location,
  locationCoords,
  geoLoading,
  geoError,
  onSearchChange,
  onApplySavedStylesChange,
  onStyleChange,
  onDistanceChange,
  onDistanceUnitChange,
  onLocationOptionChange,
  onLocationChange,
  onApplyFilters,
  onClearFilters,
  onCreateTattoo
}) => {
  const { styles, loading: stylesLoading } = useStyles();
  const me = useUserData();

  // Distance options in miles
  const distanceOptions = [25, 50, 75, 100];

  return (
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
            placeholder={type === 'artists' ? "Artist name or studio" : "enter artist, description or tags"}
            value={searchString}
            onChange={onSearchChange}
            inputProps={{ 'aria-label': 'search' }}
            endAdornment={
              searchString ? (
                <IconButton
                  size="small"
                  onClick={() => {
                    // This will be handled by parent component
                    const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
                    onSearchChange(event);
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

      {/* Create Tattoo Button for Artists */}
      {me?.type === 'artist' && onCreateTattoo && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTattoo}
            fullWidth
            sx={{
              py: 1.5,
            }}
          >
            Upload
          </Button>
        </Box>
      )}

      {/* Location origin selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Location:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControl component="fieldset">
            <RadioGroup
              value={
                useAnyLocation
                  ? 'any'
                  : useMyLocation
                    ? 'my'
                    : 'custom'
              }
              onChange={(e) => onLocationOptionChange(e.target.value as 'my' | 'custom' | 'any')}
            >
              <FormControlLabel
                  value="any"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2">Anywhere</Typography>}
              />
              <FormControlLabel
                value="my"
                control={<Radio size="small" color="primary" />}
                label={<Typography variant="body2">Near Me</Typography>}
              />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" color="primary" />}
                label={<Typography variant="body2">Near:</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {/* Only show the location input when custom location is selected */}
          {!useMyLocation && !useAnyLocation && (
            <TextField
              placeholder="Enter city, zip, or address"
              value={location}
              onChange={onLocationChange}
              size="small"
              fullWidth
              variant="outlined"
              error={Boolean(geoError)}
              helperText={geoError}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e8dbc5'
                  }
                },
                endAdornment: geoLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }}
            />
          )}
        </Box>
      </Box>

      {/* Distance selection - only show when location-based filtering is active */}
      {(useMyLocation || (!useMyLocation && !useAnyLocation)) && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" gutterBottom>
              Distance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                value="mi"
                control={
                  <Radio
                    size="small"
                    checked={distanceUnit === 'mi'}
                    onChange={() => onDistanceUnitChange('mi')}
                    color="primary"
                  />
                }
                label={<Typography variant="body2">miles</Typography>}
              />
              <FormControlLabel
                value="km"
                control={
                  <Radio
                    size="small"
                    checked={distanceUnit === 'km'}
                    onChange={() => onDistanceUnitChange('km')}
                    color="primary"
                  />
                }
                label={<Typography variant="body2">km</Typography>}
              />
            </Box>
          </Box>
          <FormControl fullWidth variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8dbc5' } }}>
            <Select
              value={distance}
              onChange={onDistanceChange}
              displayEmpty
              sx={{ borderColor: '#e8dbc5' }}
            >
              {distanceOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Apply Saved Search */}
      {me?.styles && me.styles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={applySavedStyles}
                onChange={onApplySavedStylesChange}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="body2">Apply my saved styles</Typography>
            }
          />
        </Box>
      )}

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
                      onChange={() => onStyleChange(style.id)}
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
          onClick={onApplyFilters}
        >
          Apply Filters
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={onClearFilters}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
};