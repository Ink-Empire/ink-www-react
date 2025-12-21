import React from 'react';
import { useUserData } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  Stack, 
  Chip, 
  Button, 
  Divider, 
  Skeleton,
  Alert,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';

const UserInfoCard: React.FC = () => {
  // Using the useUserData hook
  const user = useUserData();
  
  // If still loading, show loading state
  if (user.loading) {
    return (
      <Card sx={{ maxWidth: 480, mx: 'auto', boxShadow: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={64} height={64} sx={{ mr: 2 }} />
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="text" width="70%" height={32} />
              <Skeleton variant="text" width="50%" />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} />
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" height={36} width="100%" />
            <Skeleton variant="rectangular" height={36} width="100%" />
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // If error, show error state
  if (user.error) {
    return (
      <Card sx={{ maxWidth: 480, mx: 'auto', boxShadow: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error">
            Error loading user data: {user.error}
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ maxWidth: 480, mx: 'auto', boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={user.image || undefined}
            alt={user.name || 'User profile'}
            sx={{ 
              width: 64, 
              height: 64, 
              mr: 2,
              bgcolor: 'primary.light',
              fontSize: '1.5rem'
            }}
          >
            {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
          </Avatar>
          
          <Box>
            <Typography variant="h5" component="h2" fontWeight="medium">
              {user.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Stack spacing={2}>
          {user.location && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Typography variant="body1">
                {user.location}
              </Typography>
            </Box>
          )}
          
          {user.styles && user.styles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Preferred Styles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {user.styles.map(styleId => (
                  <Chip 
                    key={styleId} 
                    label={`Style #${styleId}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
        
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<EditIcon />}
                onClick={() => user.updateUser({ name: 'Updated Name' })}
              >
                Update Name
              </Button>
            </Grid>
            <Grid size={6}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={user.logout}
              >
                Logout
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;