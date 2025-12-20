import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useInboxCount } from '../hooks';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Avatar,
  Stack,
  Badge,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoText from './LogoText';
import { colors } from '@/styles/colors';

// Navigation link configuration
const NAV_LINKS = [
  { href: '/artists', label: 'Find Artists', mobileLabel: 'Find Artists' },
  { href: '/tattoos', label: 'Browse Tattoos', mobileLabel: 'Browse Tattoos' },
  { href: '/for-artists', label: 'For Artists', mobileLabel: 'For Artists', desktopOnly: true },
];

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const { count: inboxCount } = useInboxCount(user?.id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
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

  const getInitials = () => {
    if (user?.first_name) return user.first_name.charAt(0);
    if (user?.name) return user.name.charAt(0);
    if (user?.email) return user.email.charAt(0);
    return '?';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Profile';
  };

  const isActiveRoute = (href: string) => {
    if (href === '/artists') return router.pathname.startsWith('/artists');
    return router.pathname === href;
  };

  const navLinkStyles = {
    color: colors.accent,
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    '&:hover': { color: colors.accentHover },
  };

  return (
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

        {/* Logo */}
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
            alt="InkedIn Logo"
            width={isMobile ? "40" : "64"}
            height={isMobile ? "40" : "64"}
            style={{
              marginRight: isMobile ? '8px' : '12px',
              filter: 'brightness(1.2) contrast(1.1)'
            }}
          />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <LogoText fontSize={isMobile ? "1.25rem" : "2.5rem"} />
          </Box>
        </Box>

        {/* Spacer */}
        {!isMobile && <Box sx={{ flexGrow: 1 }} />}

        {/* Desktop Navigation */}
        {!isMobile && (
          <Stack direction="row" spacing={4} alignItems="center">
            {NAV_LINKS.map((link) => (
              <Box
                key={link.href}
                component={Link}
                href={link.href}
                sx={navLinkStyles}
              >
                {link.label}
              </Box>
            ))}
          </Stack>
        )}

        {/* Desktop User Menu */}
        {!isMobile && (
          <Box sx={{ ml: 4 }}>
            {isAuthenticated ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  component={Link}
                  href="/inbox"
                  sx={{
                    color: colors.textPrimary,
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
                  }}
                >
                  <Badge
                    badgeContent={inboxCount > 0 ? inboxCount : null}
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
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
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
                    '&:hover': { backgroundColor: `${colors.accentHover} !important` }
                  }}
                >
                  Join Now
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {/* Mobile User Menu */}
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
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
                  }}
                >
                  <Badge
                    badgeContent={inboxCount > 0 ? inboxCount : null}
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

                <IconButton component={Link} href="/profile" size="small">
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
                    '&:hover': { backgroundColor: `${colors.accentHover} !important` }
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
                alt="InkedIn Logo"
                width="32"
                height="32"
                style={{
                  marginRight: '8px',
                  filter: 'brightness(1.2) contrast(1.1)'
                }}
              />
              <LogoText fontSize="1.25rem" />
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <List>
            {NAV_LINKS.filter(link => !link.desktopOnly).map((link) => (
              <ListItem
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isActiveRoute(link.href) ? `${colors.accent}33` : 'transparent',
                  '&:hover': { backgroundColor: `${colors.accent}1A` }
                }}
              >
                <ListItemText primary={link.mobileLabel} />
              </ListItem>
            ))}

            {isAuthenticated ? (
              <>
                <ListItem
                  component={Link}
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
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
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
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
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
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
                    '&:hover': { backgroundColor: colors.accentHover }
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
  );
};

export default Navbar;
