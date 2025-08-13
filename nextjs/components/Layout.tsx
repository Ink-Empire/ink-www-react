import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useInboxCount } from '../hooks';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Stack, Tabs, Tab, Badge, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoText from './LogoText';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { userData } = useUser();
  const router = useRouter();
  const { count: inboxCount } = useInboxCount(user?.id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State to store the avatar image URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // State for mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Update avatar URL when user data changes
  useEffect(() => {
    // Check for profile image sources in order of preference
    if ((user as any)?.image) {
      setAvatarUrl((user as any).image);
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
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo - Always visible */}
          <Box 
            component={Link}
            href="/"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flex: isMobile ? 1 : 'none'
            }}
          >
            <img 
              src="/assets/img/logo.png"
              alt="Cat Logo" 
              width={isMobile ? "40" : "64"}
              height={isMobile ? "40" : "64"}
              style={{ 
                marginRight: isMobile ? '8px' : '12px',
                filter: 'brightness(1.2) contrast(1.1)'
              }}
            />
            <LogoText fontSize={isMobile ? "1.5rem" : "2.5rem"} />
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Tabs 
              value={
                router.pathname === '/' ? 0 :
                router.pathname.startsWith('/artists') ? 1 : false
              }
              indicatorColor="primary"
              textColor="inherit"
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
            </Tabs>
          )}
          
          {/* User Menu - Desktop */}
          {!isMobile && (
            <Box>
              {isAuthenticated ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton
                    component={Link}
                    href="/inbox"
                    sx={{ 
                      color: 'text.primary',
                      '&:hover': { 
                        backgroundColor: 'rgba(51, 153, 137, 0.1)'
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={inboxCount > 0 ? inboxCount : null} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#339989',
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                    >
                      <InboxIcon />
                    </Badge>
                  </IconButton>

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
          )}
          
          {/* Mobile User Avatar/Login */}
          {isMobile && (
            <Box>
              {isAuthenticated ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    component={Link}
                    href="/inbox"
                    size="small"
                    sx={{ 
                      color: 'text.primary',
                      '&:hover': { 
                        backgroundColor: 'rgba(51, 153, 137, 0.1)'
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={inboxCount > 0 ? inboxCount : null} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#339989',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          minWidth: '16px',
                          height: '16px'
                        }
                      }}
                    >
                      <InboxIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                  
                  <IconButton
                    component={Link}
                    href="/profile"
                    size="small"
                  >
                    <Avatar 
                      src={avatarUrl || undefined}
                      alt={getDisplayName()}
                      sx={{ 
                        width: 28, 
                        height: 28,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                      }}
                    >
                      {getInitials()}
                    </Avatar>
                  </IconButton>
                </Stack>
              ) : (
                <Stack direction="row" spacing={0.5}>
                  <Button 
                    component={Link} 
                    href="/login"
                    size="small"
                    sx={{ 
                      color: 'text.primary', 
                      fontSize: '0.8rem',
                      minWidth: { xs: '60px', sm: 'auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ 
                      fontSize: '0.8rem',
                      minWidth: { xs: '65px', sm: 'auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    Sign up
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </Toolbar>
        
        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: '#1c0f13',
              color: 'white',
              width: 280
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="/assets/img/logo.png"
                  alt="Cat Logo" 
                  width="32"
                  height="32"
                  style={{ 
                    marginRight: '8px',
                    filter: 'brightness(1.2) contrast(1.1)'
                  }}
                />
                <LogoText fontSize="1.25rem" />
              </Box>
              <IconButton
                onClick={() => setMobileMenuOpen(false)}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
            
            <List>
              <ListItem 
                component={Link}
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                sx={{ 
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname === '/' ? 'rgba(51, 153, 137, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 153, 137, 0.1)'
                  }
                }}
              >
                <ListItemText primary="Home" />
              </ListItem>
              
              <ListItem 
                component={Link}
                href="/artists"
                onClick={() => setMobileMenuOpen(false)}
                sx={{ 
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname.startsWith('/artists') ? 'rgba(51, 153, 137, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 153, 137, 0.1)'
                  }
                }}
              >
                <ListItemText primary="Artists" />
              </ListItem>
              
              {isAuthenticated ? (
                <>
                  <ListItem 
                    component={Link}
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(51, 153, 137, 0.1)'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar 
                        src={avatarUrl || undefined}
                        alt={getDisplayName()}
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                        }}
                      >
                        {getInitials()}
                      </Avatar>
                      <ListItemText primary={getDisplayName()} />
                    </Stack>
                  </ListItem>
                  
                  <ListItem 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(51, 153, 137, 0.1)'
                      }
                    }}
                  >
                    <ListItemText primary="Log out" />
                  </ListItem>
                </>
              ) : (
                <>
                  <ListItem 
                    component={Link}
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(51, 153, 137, 0.1)'
                      }
                    }}
                  >
                    <ListItemText primary="Log in" />
                  </ListItem>
                  
                  <ListItem 
                    component={Link}
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: 'rgba(51, 153, 137, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(51, 153, 137, 1)'
                      }
                    }}
                  >
                    <ListItemText primary="Sign up" />
                  </ListItem>
                </>
              )}
            </List>
          </Box>
        </Drawer>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 3 }
          }}
        >
          <Box 
            sx={{ 
              bgcolor: '#2a1a1e', 
              borderRadius: 2, 
              p: { xs: 2, sm: 3 }, 
              boxShadow: 1, 
              color: 'text.primary' 
            }}
          >
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