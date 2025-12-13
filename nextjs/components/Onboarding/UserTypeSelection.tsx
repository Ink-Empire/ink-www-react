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
  Person as PersonIcon,
  Brush as BrushIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';

interface UserTypeSelectionProps {
  onStepComplete: (userType: 'client' | 'artist' | 'studio') => void;
  onBack?: () => void;
  onCancel?: () => void;
}

const UserTypeSelection: React.FC<UserTypeSelectionProps> = ({ onStepComplete, onBack, onCancel }) => {
  const userTypes = [
    {
      type: 'client' as const,
      title: 'Tattoo Enthusiast',
      description: 'I\'m looking for inspiration, artists, and planning my next tattoo',
      icon: PersonIcon,
      color: colors.textSecondary,
    },
    {
      type: 'artist' as const,
      title: 'Tattoo Artist',
      description: 'I create beautiful tattoos and want to showcase my work',
      icon: BrushIcon,
      color: colors.accent,
    },
    {
      type: 'studio' as const,
      title: 'Tattoo Studio',
      description: 'I represent a studio and manage multiple artists',
      icon: BusinessIcon,
      color: colors.accentDark,
    },
  ];

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: colors.textSecondary,
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        Welcome to InkedIn
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          mb: 3,
          color: 'text.secondary',
          fontSize: { xs: '0.95rem', md: '1rem' },
          lineHeight: 1.5,
          maxWidth: 450,
          mx: 'auto',
        }}
      >
        Let's get you set up! Tell us what brings you to our community.
      </Typography>

      <Stack spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 500, mx: 'auto' }}>
        {userTypes.map((userType) => {
          const IconComponent = userType.icon;
          return (
            <Card
              key={userType.type}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: colors.surface,
                border: '2px solid transparent',
                '&:hover': {
                  border: `2px solid ${userType.color}`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px rgba(51, 153, 137, 0.15)`,
                },
              }}
              onClick={() => onStepComplete(userType.type)}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack 
                  direction="row" 
                  spacing={2} 
                  alignItems="center"
                  sx={{ textAlign: 'left' }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: userType.color,
                      color: '#000',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 24 }} />
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: userType.color,
                        mb: 1,
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      }}
                    >
                      {userType.title}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.5,
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      }}
                    >
                      {userType.description}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Cancel button in bottom right */}
      {onCancel && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              color: colors.textSecondary,
              borderColor: colors.textSecondary,
              minWidth: '80px',
              '&:hover': {
                backgroundColor: 'rgba(232, 219, 197, 0.1)',
                borderColor: colors.textSecondary,
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {onBack && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              color: colors.textSecondary,
              borderColor: colors.textSecondary,
              '&:hover': {
                backgroundColor: 'rgba(232, 219, 197, 0.1)',
                borderColor: colors.textSecondary,
              },
            }}
          >
            Back
          </Button>
        </Box>
      )}

      <Typography
        variant="body2"
        sx={{
          mt: 4,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        Don't worry, you can always change this later in your profile settings.
      </Typography>
    </Box>
  );
};

export default UserTypeSelection;