import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadConversationCount } from '../hooks';
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
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '@/styles/colors';

// Navigation link configuration
const NAV_LINKS = [
  { href: '/artists', label: 'Find Artists', mobileLabel: 'Find Artists' },
  { href: '/tattoos', label: 'Browse Tattoos', mobileLabel: 'Browse Tattoos' },
];

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount: inboxCount } = useUnreadConversationCount();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // For studio accounts, use the studio image; otherwise use user image
    const isStudio = user?.type_id === 4 || user?.type_id === '4' || user?.type === 'studio';
    const studioImg = (user as any)?.owned_studio?.image;
    const userImg = (user as any)?.image;

    // Pick the right image source
    const img = isStudio && studioImg ? studioImg : userImg;

    if (typeof img === 'string') {
      setAvatarUrl(img);
    } else if (img?.uri) {
      setAvatarUrl(img.uri);
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
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 80 }, pl: { xs: 1, sm: 1, md: 2 }, pr: { xs: 1, sm: 2, md: 3 } }}>
        {/* Mobile Menu Button */}
        <IconButton
          onClick={() => setMobileMenuOpen(true)}
          sx={{
            mr: 1,
            color: colors.textPrimary,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <MenuIcon />
        </IconButton>

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
          {/* Mobile: just rose icon */}
          <Box
            component="img"
            src="/assets/img/logo.png"
            alt="InkedIn"
            sx={{
              display: { xs: 'block', sm: 'none' },
              width: '60px',
              height: 'auto',
            }}
          />
          {/* Tablet+: full logo */}
          <Box
            component="img"
            src="/assets/images/inkedin-logo.png"
            alt="InkedIn"
            sx={{
              display: { xs: 'none', sm: 'block' },
              width: { sm: '240px', md: '300px' },
              height: 'auto',
            }}
          />
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
                  onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
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

                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={() => setProfileMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      bgcolor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 2,
                      mt: 1,
                      minWidth: 180,
                    }
                  }}
                >
                  {/* My Profile - for artists and studios */}
                  {user?.type_id === 2 && user?.slug && (
                    <MenuItem
                      component={Link}
                      href={`/artists/${user.slug}`}
                      onClick={() => setProfileMenuAnchor(null)}
                      sx={{
                        color: colors.textPrimary,
                        '&:hover': { bgcolor: `${colors.accent}1A` }
                      }}
                    >
                      <ListItemIcon>
                        <PersonIcon sx={{ color: colors.textSecondary }} />
                      </ListItemIcon>
                      <ListItemText primary="My Profile" />
                    </MenuItem>
                  )}
                  {(user?.type_id === 3) && user?.owned_studio?.slug && (
                    <MenuItem
                      component={Link}
                      href={`/studios/${user.owned_studio.slug}`}
                      onClick={() => setProfileMenuAnchor(null)}
                      sx={{
                        color: colors.textPrimary,
                        '&:hover': { bgcolor: `${colors.accent}1A` }
                      }}
                    >
                      <ListItemIcon>
                        <PersonIcon sx={{ color: colors.textSecondary }} />
                      </ListItemIcon>
                      <ListItemText primary="My Profile" />
                    </MenuItem>
                  )}
                  <MenuItem
                    component={Link}
                    href="/dashboard"
                    onClick={() => setProfileMenuAnchor(null)}
                    sx={{
                      color: colors.textPrimary,
                      '&:hover': { bgcolor: `${colors.accent}1A` }
                    }}
                  >
                    <ListItemIcon>
                      <DashboardIcon sx={{ color: colors.textSecondary }} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={() => setProfileMenuAnchor(null)}
                    sx={{
                      color: colors.textPrimary,
                      '&:hover': { bgcolor: `${colors.accent}1A` }
                    }}
                  >
                    <ListItemIcon>
                      <SettingsIcon sx={{ color: colors.textSecondary }} />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                  </MenuItem>
                  <Divider sx={{ borderColor: colors.border, my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      setProfileMenuAnchor(null);
                      handleLogout();
                    }}
                    sx={{
                      color: colors.textPrimary,
                      '&:hover': { bgcolor: `${colors.accent}1A` }
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon sx={{ color: colors.textSecondary }} />
                    </ListItemIcon>
                    <ListItemText primary="Log out" />
                  </MenuItem>
                </Menu>
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

                <IconButton component={Link} href={user?.type_id === 1 || user?.type_id === '1' || user?.type === 'client' || user?.type === 'user' ? '/dashboard' : '/profile'} size="small">
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
          <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 3 }}>
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
                {/* My Profile - for artists */}
                {user?.type_id === 2 && user?.slug && (
                  <ListItem
                    component={Link}
                    href={`/artists/${user.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: `${colors.accent}1A` }
                    }}
                  >
                    <ListItemText primary="My Profile" />
                  </ListItem>
                )}
                {/* My Profile - for studios */}
                {(user?.type_id === 3 || user?.type_id === 4) && user?.owned_studio?.slug && (
                  <ListItem
                    component={Link}
                    href={`/studios/${user.owned_studio.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: `${colors.accent}1A` }
                    }}
                  >
                    <ListItemText primary="My Profile" />
                  </ListItem>
                )}

                {/* Dashboard */}
                <ListItem
                  component={Link}
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isActiveRoute('/dashboard') ? `${colors.accent}33` : 'transparent',
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
                  }}
                >
                  <ListItemText primary="Dashboard" />
                </ListItem>

                {/* Settings */}
                <ListItem
                  component={Link}
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isActiveRoute('/profile') ? `${colors.accent}33` : 'transparent',
                    '&:hover': { backgroundColor: `${colors.accent}1A` }
                  }}
                >
                  <ListItemText primary="Settings" />
                </ListItem>

                {/* Log out */}
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
