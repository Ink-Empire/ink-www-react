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

  const handleSkip = () => {
    onStepComplete([]);
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
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: '#e8dbc5',
            fontSize: { xs: '1.5rem', md: '2rem' }, // Slightly smaller for compact panel
          }}
        >
          {getTitle()}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.5,
            maxWidth: 500,
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
            mb: 1,
          }}
        >
          {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Grid container spacing={2} sx={{ maxWidth: 600, justifyContent: 'center' }}>
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
                    {userType === 'client'
                        ? 'Select styles you\'re interested in, or skip for now and add them later'
                        : 'Choose styles you specialize in. You can always update this later.'
                    }
             </Typography>
            )}
        </Grid>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            onClick={handleSkip}
            sx={{
              color: '#e8dbc5',
              borderColor: '#e8dbc5',
              minWidth: { xs: '120px', sm: '100px' },
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
              minWidth: { xs: '120px', sm: '100px' },
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


        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            color: '#e8dbc5',
            borderColor: '#e8dbc5',
            minWidth: '80px',
            '&:hover': {
              backgroundColor: 'rgba(232, 219, 197, 0.1)',
              borderColor: '#e8dbc5',
            },
          }}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default StylesSelection;