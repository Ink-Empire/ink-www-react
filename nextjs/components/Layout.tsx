import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import Navbar from './Navbar';
import LogoText from './LogoText';
import { colors } from '@/styles/colors';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  // Pages that handle their own layout (no container wrapper)
  const fullWidthPages = ['/', '/login', '/register', '/how-it-works', '/for-artists'];
  const isFullWidthPage = fullWidthPages.some(page =>
    router.pathname === page || router.pathname.startsWith(`${page}/`)
  );

  // Pages that have a sidebar (footer needs left margin on desktop)
  const sidebarPages = ['/artists', '/tattoos'];
  const hasSidebar = sidebarPages.some(page => router.pathname.startsWith(page));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <Box component="main" sx={{ flexGrow: 1, bgcolor: colors.background }}>
        {isFullWidthPage ? (
          children
        ) : (
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
        )}
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          py: 3,
          mt: 'auto',
          bgcolor: colors.background,
          ml: { md: hasSidebar ? '280px' : 0 },
          transition: 'margin-left 0.3s ease'
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', md: 'flex-start' }}
            spacing={2}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              &copy; {new Date().getFullYear()} <LogoText fontSize="1.25rem" />. All rights reserved.
            </Typography>

            <Stack direction="row" spacing={3}>
              <Button component={Link} href="/about" color="inherit" size="small">
                About
              </Button>
              <Button component={Link} href="/contact" color="inherit" size="small">
                Contact
              </Button>
              <Button component={Link} href="/privacy" color="inherit" size="small">
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
