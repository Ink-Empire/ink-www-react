import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useInboxCount } from '../hooks';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Stack, Badge, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoText from './LogoText';
import { DebugAuth } from './DebugAuth';
import { colors } from '@/styles/colors';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  
  // Debug: Log user data to console
  useEffect(() => {
    console.log('Layout - Debug user data:', { isAuthenticated, user });
  }, [isAuthenticated, user]);
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
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get user's initials for avatar
  const getInitials = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0);
    } else if (user?.name) {
      return user.name.charAt(0);
    } else if (user?.email) {
      return user.email.charAt(0);
    }
    return '?';
  };

  // Get user's display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.name) {
      return user.name;
    } else if (user?.email) {
      return user.email;
    }
    return 'Profile';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2} sx={{ backgroundColor: colors.background }}>
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

          {/* Spacer to push nav to the right */}
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Stack direction="row" spacing={4} alignItems="center">
              <Typography
                component={Link}
                href="/artists"
                sx={{
                  color: colors.accent,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    color: colors.accentHover,
                  },
                }}
              >
                Find Artists
              </Typography>
              <Typography
                component={Link}
                href="/tattoos"
                sx={{
                  color: colors.accent,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    color: colors.accentHover,
                  },
                }}
              >
                Styles
              </Typography>
              <Typography
                component={Link}
                href="/how-it-works"
                sx={{
                  color: colors.accent,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    color: colors.accentHover,
                  },
                }}
              >
                How It Works
              </Typography>
              <Typography
                component={Link}
                href="/for-artists"
                sx={{
                  color: colors.accent,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    color: colors.accentHover,
                  },
                }}
              >
                For Artists
              </Typography>
            </Stack>
          )}

          {/* User Menu - Desktop */}
          {!isMobile && (
            <Box sx={{ ml: 4 }}>
              {isAuthenticated ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton
                    component={Link}
                    href="/inbox"
                    sx={{
                      color: colors.textPrimary,
                      '&:hover': {
                        backgroundColor: `${colors.accent}1A`
                      }
                    }}
                  >
                    <Badge
                      badgeContent={inboxCount > 0 ? inboxCount : null}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: colors.accent,
                          color: colors.background,
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
                          bgcolor: colors.accent,
                          color: colors.background,
                        }}
                      >
                        {getInitials()}
                      </Avatar>
                    }
                    sx={{
                      textTransform: 'none',
                      color: colors.textPrimary,
                      '&:hover': {
                        backgroundColor: `${colors.accent}1A`
                      }
                    }}
                  >
                    {getDisplayName()}
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLogout}
                    sx={{
                      color: colors.textPrimary,
                      borderColor: colors.textSecondary,
                      '&:hover': {
                        borderColor: colors.textPrimary,
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    Log out
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={2}>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    sx={{
                      color: colors.textPrimary,
                      borderColor: colors.textSecondary,
                      textTransform: 'none',
                      px: 3,
                      '&:hover': {
                        borderColor: colors.textPrimary,
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    disableElevation
                    sx={{
                      backgroundColor: `${colors.accent} !important`,
                      color: `${colors.background} !important`,
                      textTransform: 'none',
                      px: 3,
                      fontWeight: 600,
                      border: 'none',
                      '&:hover': {
                        backgroundColor: `${colors.accentHover} !important`,
                      }
                    }}
                  >
                    Join Now
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
                        backgroundColor: `${colors.accent}1A`
                      }
                    }}
                  >
                    <Badge
                      badgeContent={inboxCount > 0 ? inboxCount : null}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: colors.accent,
                          color: colors.background,
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
                <Stack direction="row" spacing={1}>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    size="small"
                    sx={{
                      color: colors.textPrimary,
                      borderColor: colors.textSecondary,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      px: 2,
                      '&:hover': {
                        borderColor: colors.textPrimary,
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    size="small"
                    disableElevation
                    sx={{
                      backgroundColor: `${colors.accent} !important`,
                      color: `${colors.background} !important`,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      border: 'none',
                      px: 2,
                      '&:hover': {
                        backgroundColor: `${colors.accentHover} !important`,
                      }
                    }}
                  >
                    Join Now
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
              backgroundColor: colors.background,
              color: colors.textPrimary,
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
                href="/artists"
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname.startsWith('/artists') ? `${colors.accent}33` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${colors.accent}1A`
                  }
                }}
              >
                <ListItemText primary="Find Artists" />
              </ListItem>

              <ListItem
                component={Link}
                href="/tattoos"
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname === '/tattoos' ? `${colors.accent}33` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${colors.accent}1A`
                  }
                }}
              >
                <ListItemText primary="Styles" />
              </ListItem>

              <ListItem
                component={Link}
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname === '/how-it-works' ? `${colors.accent}33` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${colors.accent}1A`
                  }
                }}
              >
                <ListItemText primary="How It Works" />
              </ListItem>

              <ListItem
                component={Link}
                href="/for-artists"
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: router.pathname === '/for-artists' ? `${colors.accent}33` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${colors.accent}1A`
                  }
                }}
              >
                <ListItemText primary="For Artists" />
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
                        backgroundColor: `${colors.accent}1A`
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
                          bgcolor: colors.accent,
                          color: colors.background,
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
                        backgroundColor: `${colors.accent}1A`
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
                      border: `1px solid ${colors.textSecondary}`,
                      '&:hover': {
                        backgroundColor: `${colors.accent}1A`
                      }
                    }}
                  >
                    <ListItemText primary="Sign In" sx={{ textAlign: 'center' }} />
                  </ListItem>

                  <ListItem
                    component={Link}
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: colors.accent,
                      '&:hover': {
                        backgroundColor: colors.accentHover
                      }
                    }}
                  >
                    <ListItemText
                      primary="Join Now"
                      sx={{
                        textAlign: 'center',
                        '& .MuiTypography-root': {
                          color: colors.background,
                          fontWeight: 600
                        }
                      }}
                    />
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
              bgcolor: colors.surface,
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
          bgcolor: colors.background
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
      
      {/* Debug component for development */}
      {/*<DebugAuth />*/}
    </Box>
  );
};

export default Layout;