import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useStyles } from '../../contexts/StyleContext';

interface StylesSelectionProps {
  onStepComplete: (selectedStyles: number[]) => void;
  onBack: () => void;
  userType: 'client' | 'artist' | 'studio';
}

const StylesSelection: React.FC<StylesSelectionProps> = ({ 
  onStepComplete, 
  onBack, 
  userType 
}) => {
  const { styles, loading, error } = useStyles();
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);

  const handleStyleToggle = (styleId: number) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleContinue = () => {
    onStepComplete(selectedStyles);
  };

  const getTitle = () => {
    switch (userType) {
      case 'artist':
        return 'What styles do you specialize in?';
      case 'studio':
        return 'What styles does your studio offer?';
      default:
        return 'What tattoo styles interest you?';
    }
  };

  const getDescription = () => {
    switch (userType) {
      case 'artist':
        return 'Select the tattoo styles you create or want to be known for. This helps clients find you when searching for specific styles.';
      case 'studio':
        return 'Select the tattoo styles your studio specializes in. This represents the collective expertise of your artists.';
      default:
        return 'Choose the tattoo styles you love or are curious about. We\'ll use this to show you relevant artists and inspiration.';
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#339989' }} size={60} />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading tattoo styles...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            color: '#e8dbc5',
            borderColor: '#e8dbc5',
            '&:hover': {
              backgroundColor: 'rgba(232, 219, 197, 0.1)',
              borderColor: '#e8dbc5',
            },
          }}
        >
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: '#e8dbc5',
          }}
        >
          {getTitle()}
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: 'text.secondary',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          {getDescription()}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#339989',
            fontWeight: 'bold',
          }}
        >
          {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {styles.map((style) => (
          <Grid item xs={6} sm={4} md={3} key={style.id}>
            <Chip
              label={style.name}
              onClick={() => handleStyleToggle(style.id)}
              variant={selectedStyles.includes(style.id) ? "filled" : "outlined"}
              sx={{
                width: '100%',
                height: '48px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                backgroundColor: selectedStyles.includes(style.id) ? '#339989' : 'transparent',
                color: selectedStyles.includes(style.id) ? '#000' : '#e8dbc5',
                borderColor: selectedStyles.includes(style.id) ? '#339989' : 'rgba(232, 219, 197, 0.5)',
                '&:hover': {
                  backgroundColor: selectedStyles.includes(style.id) 
                    ? '#2a7f7a' 
                    : 'rgba(232, 219, 197, 0.1)',
                  borderColor: selectedStyles.includes(style.id) ? '#2a7f7a' : '#e8dbc5',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(51, 153, 137, 0.2)',
                },
                '& .MuiChip-label': {
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  padding: '8px',
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            color: '#e8dbc5',
            borderColor: '#e8dbc5',
            '&:hover': {
              backgroundColor: 'rgba(232, 219, 197, 0.1)',
              borderColor: '#e8dbc5',
            },
          }}
        >
          Back
        </Button>
        
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          {userType === 'client' 
            ? 'Don\'t see a style you like? You can always add more later!'
            : 'You can always update your specialties in your profile settings.'
          }
        </Typography>

        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            onClick={handleContinue}
            sx={{
              color: '#e8dbc5',
              borderColor: '#e8dbc5',
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                backgroundColor: 'rgba(232, 219, 197, 0.1)',
                borderColor: '#e8dbc5',
              },
            }}
          >
            Skip for now
          </Button>
          
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={selectedStyles.length === 0}
            sx={{
              backgroundColor: '#339989',
              color: '#000',
              fontWeight: 'bold',
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                backgroundColor: '#2a7f7a',
              },
              '&:disabled': {
                backgroundColor: 'rgba(232, 219, 197, 0.3)',
                color: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            Continue
          </Button>
        </Stack>
      </Stack>

      {selectedStyles.length === 0 && (
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 2,
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          Select styles you're interested in, or skip for now and add them later
        </Typography>
      )}
    </Box>
  );
};

export default StylesSelection;