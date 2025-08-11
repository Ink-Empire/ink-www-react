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

interface UserTypeSelectionProps {
  onStepComplete: (userType: 'client' | 'artist' | 'studio') => void;
  onBack?: () => void;
}

const UserTypeSelection: React.FC<UserTypeSelectionProps> = ({ onStepComplete, onBack }) => {
  const userTypes = [
    {
      type: 'client' as const,
      title: 'Tattoo Enthusiast',
      description: 'I\'m looking for inspiration, artists, and planning my next tattoo',
      icon: PersonIcon,
      color: '#e8dbc5',
    },
    {
      type: 'artist' as const,
      title: 'Tattoo Artist',
      description: 'I create beautiful tattoos and want to showcase my work',
      icon: BrushIcon,
      color: '#339989',
    },
    {
      type: 'studio' as const,
      title: 'Tattoo Studio',
      description: 'I represent a studio and manage multiple artists',
      icon: BusinessIcon,
      color: '#2a7f7a',
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
          color: '#e8dbc5',
        }}
      >
        Welcome to InkedIn
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
        Let's get you set up! Tell us what brings you to our community.
      </Typography>

      <Stack spacing={3}>
        {userTypes.map((userType) => {
          const IconComponent = userType.icon;
          return (
            <Card
              key={userType.type}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: '#2a1a1e',
                border: '2px solid transparent',
                '&:hover': {
                  border: `2px solid ${userType.color}`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px rgba(51, 153, 137, 0.15)`,
                },
              }}
              onClick={() => onStepComplete(userType.type)}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                      backgroundColor: userType.color,
                      color: '#000',
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

      {onBack && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
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