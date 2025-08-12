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

interface ArtistPreferencesSelectionProps {
  onStepComplete: (preferredStyles: number[]) => void;
  onBack: () => void;
  specialtyStyles: number[]; // The styles they already selected as specialties
}

const ArtistPreferencesSelection: React.FC<ArtistPreferencesSelectionProps> = ({ 
  onStepComplete, 
  onBack,
  specialtyStyles
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
    // Skip with empty selection
    onStepComplete([]);
  };

  // Filter out styles that are already selected as specialties
  const availableStyles = styles.filter(style => !specialtyStyles.includes(style.id));
  const specialtyStyleNames = styles
    .filter(style => specialtyStyles.includes(style.id))
    .map(style => style.name);

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
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          What styles do you enjoy working in?
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
          Beyond your specialties, what other tattoo styles do you enjoy creating or want to explore? This helps us show you relevant inspiration and potential clients.
        </Typography>

        {specialtyStyleNames.length > 0 && (
          <Box sx={{ mb: 3, p: 3, backgroundColor: 'rgba(51, 153, 137, 0.1)', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: '#339989', fontWeight: 'bold', mb: 2 }}>
              Your specialties: {specialtyStyleNames.join(', ')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Choose additional styles you enjoy working in or want to learn
            </Typography>
          </Box>
        )}

        <Typography
          variant="body2"
          sx={{
            color: '#339989',
            fontWeight: 'bold',
          }}
        >
          {selectedStyles.length} additional style{selectedStyles.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>

      {availableStyles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            You've selected all available styles as your specialties! You can continue to the next step.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Grid container spacing={2} sx={{ maxWidth: 600, justifyContent: 'center' }}>
          {availableStyles.map((style) => (
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
        </Box>
      )}


      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
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
            sx={{
              backgroundColor: '#339989',
              color: '#000',
              fontWeight: 'bold',
              minWidth: { xs: '120px', sm: '100px' },
              '&:hover': {
                backgroundColor: '#2a7f7a',
              },
            }}
          >
            Continue
          </Button>
        </Stack>

        {/* Back button on the right */}
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

      <Typography
        variant="body2"
        sx={{
          textAlign: 'center',
          mt: 3,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        You can always update your style preferences in your profile settings.
      </Typography>
    </Box>
  );
};

export default ArtistPreferencesSelection;