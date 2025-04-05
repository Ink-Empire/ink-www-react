import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Stack, Tabs, Tab } from '@mui/material';
import LogoText from './LogoText';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { userData } = useUser();
  const router = useRouter();
  
  // State to store the avatar image URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Update avatar URL when user data changes
  useEffect(() => {
    // Check for profile image sources in order of preference
    if (user?.image) {
      setAvatarUrl(user.image);
    } else if (userData?.profilePhoto?.webviewPath) {
      setAvatarUrl(userData.profilePhoto.webviewPath);
    } else {
      setAvatarUrl(null);
    }
  }, [user, userData]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get user's initials for avatar
  const getInitials = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0);
    } else if (userData?.name) {
      return userData.name.charAt(0);
    } else if (user?.email) {
      return user.email.charAt(0);
    } else if (userData?.email) {
      return userData.email.charAt(0);
    }
    return '?';
  };

  // Get user's display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (userData?.name) {
      return userData.name;
    } else if (user?.email) {
      return user.email;
    } else if (userData?.email) {
      return userData.email;
    }
    return 'Profile';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2} sx={{ backgroundColor: '#120a0d' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box 
              component={Link}
              href="/"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              <img 
                src="/assets/img/logo.png"
                alt="Cat Logo" 
                width="64"
                height="64"
                style={{ 
                  marginRight: '12px',
                  filter: 'brightness(1.2) contrast(1.1)'
                }}
              />
              <LogoText fontSize="2.5rem" />
            </Box>
            
            <Tabs 
              value={
                router.pathname === '/' ? 0 :
                router.pathname.startsWith('/artists') ? 1 :
                router.pathname.startsWith('/tattoos') ? 2 :
                router.pathname === '/search' ? 3 : false
              }
              indicatorColor="primary"
              textColor="white"
              TabIndicatorProps={{ sx: { height: 3 } }}
              sx={{ ml: 2 }}
            >
              <Tab 
                label="Home" 
                component={Link} 
                href="/" 
                sx={{ minWidth: 'auto' }}
              />
              <Tab 
                label="Artists" 
                component={Link} 
                href="/artists" 
                sx={{ minWidth: 'auto' }}
              />
              <Tab 
                label="Tattoos" 
                component={Link} 
                href="/tattoos" 
                sx={{ minWidth: 'auto' }}
              />
              <Tab 
                label="Search" 
                component={Link} 
                href="/search" 
                sx={{ minWidth: 'auto' }}
              />
            </Tabs>
          </Stack>
          
          <Box>
            {isAuthenticated ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                  component={Link} 
                  href="/profile"
                  startIcon={
                    <Avatar 
                      src={avatarUrl || undefined}
                      alt={getDisplayName()}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                      }}
                    >
                      {getInitials()}
                    </Avatar>
                  }
                  sx={{ 
                    textTransform: 'none', 
                    color: 'text.primary',
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {getDisplayName()}
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button 
                  component={Link} 
                  href="/login"
                  sx={{ color: 'text.primary' }}
                >
                  Log in
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Sign up
                </Button>
              </Stack>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ bgcolor: '#2a1a1e', borderRadius: 2, p: 3, boxShadow: 1, color: 'text.primary' }}>
            {children}
          </Box>
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          borderTop: '1px solid', 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          py: 3,
          mt: 'auto',
          bgcolor: '#120a0d'
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between"
            alignItems={{ xs: 'center', md: 'flex-start' }}
            spacing={2}
          >
            <Typography 
              variant="body2" 
              sx={{ color: 'text.secondary' }}
            >
              &copy; {new Date().getFullYear()} <LogoText fontSize="1.25rem" />. All rights reserved.
            </Typography>
            
            <Stack direction="row" spacing={3}>
              <Button 
                component={Link} 
                href="/about" 
                color="inherit" 
                size="small"
              >
                About
              </Button>
              <Button 
                component={Link} 
                href="/contact" 
                color="inherit" 
                size="small"
              >
                Contact
              </Button>
              <Button 
                component={Link} 
                href="/privacy" 
                color="inherit" 
                size="small"
              >
                Privacy
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;