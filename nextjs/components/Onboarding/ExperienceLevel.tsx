import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';

interface ExperienceLevelProps {
  onStepComplete: (experienceLevel: 'beginner' | 'experienced') => void;
  onBack: () => void;
}

const ExperienceLevel: React.FC<ExperienceLevelProps> = ({ onStepComplete, onBack }) => {
  const experienceLevels = [
    {
      level: 'beginner' as const,
      title: 'New to Tattoos',
      description: 'I\'m just starting my tattoo journey and would love some guidance',
      icon: SchoolIcon,
      color: colors.textSecondary,
      details: 'Perfect! We\'ll help you discover artists, understand the process, and find inspiration for your first tattoo.',
    },
    {
      level: 'experienced' as const,
      title: 'Experienced Collector',
      description: 'I already have tattoos and know what I\'m looking for',
      icon: StarIcon,
      color: colors.accent,
      details: 'Great! You can dive right in to discover new artists, share your collection, and connect with the community.',
    },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: colors.textSecondary,
        }}
      >
        Your Tattoo Experience
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          mb: 4,
          color: 'text.secondary',
          fontSize: '1.1rem',
          lineHeight: 1.6,
        }}
      >
        This helps us personalize your experience and show you the most relevant content.
      </Typography>

      <Stack spacing={3}>
        {experienceLevels.map((level) => {
          const IconComponent = level.icon;
          return (
            <Card
              key={level.level}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: colors.surface,
                border: '2px solid transparent',
                '&:hover': {
                  border: `2px solid ${level.color}`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px rgba(51, 153, 137, 0.15)`,
                },
              }}
              onClick={() => onStepComplete(level.level)}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={3} 
                    alignItems="center"
                    sx={{ textAlign: { xs: 'center', sm: 'left' } }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 50, sm: 60 },
                        height: { xs: 50, sm: 60 },
                        backgroundColor: level.color,
                        color: colors.textOnLight,
                      }}
                    >
                      <IconComponent sx={{ fontSize: { xs: 25, sm: 30 } }} />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 'bold',
                          color: level.color,
                          mb: 1,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        }}
                      >
                        {level.title}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.5,
                          fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        }}
                      >
                        {level.description}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      textAlign: { xs: 'center', sm: 'left' },
                      pl: { xs: 0, sm: 9 }, // Align with the text above on desktop only
                    }}
                  >
                    {level.details}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={{ xs: 2, sm: 0 }}
        sx={{ mt: 4 }}
      >
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            color: colors.textSecondary,
            borderColor: colors.textSecondary,
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 2, sm: 1 },
            '&:hover': {
              backgroundColor: 'rgba(232, 219, 197, 0.1)',
              borderColor: colors.textSecondary,
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
            textAlign: { xs: 'center', sm: 'right' },
            order: { xs: 1, sm: 2 },
            alignSelf: 'center',
          }}
        >
          This helps us customize your feed and recommendations
        </Typography>
      </Stack>
    </Box>
  );
};

export default ExperienceLevel;