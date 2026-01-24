import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { colors } from '@/styles/colors';
import Navbar from '@/components/Navbar';

export default function UpdatesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'subscribed' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.subscribed === 'true') {
        setStatus('subscribed');
      } else if (router.query.error) {
        setStatus('error');
        const errorCode = router.query.error as string;
        if (errorCode === 'invalid_link') {
          setErrorMessage('This link has expired or is invalid. Please check your email for a valid link.');
        } else if (errorCode === 'user_not_found') {
          setErrorMessage('We couldn\'t find your account. Please contact support if this issue persists.');
        } else {
          setErrorMessage('Something went wrong. Please try again.');
        }
      }
    }
  }, [router.isReady, router.query]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <Navbar />

      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        {status === 'subscribed' && (
          <Box sx={{ mt: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: colors.success, mb: 3 }} />
            <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
              You're all set!
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
              You're all set to receive updates on our progress. We'll keep you in the loop as we ship new features and grow the platform.
            </Typography>
            <Button
              variant="contained"
              href="/"
              sx={{
                bgcolor: colors.accent,
                color: colors.textOnLight,
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: colors.accentDark },
              }}
            >
              Back to Home
            </Button>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ mt: 4 }}>
            <ErrorIcon sx={{ fontSize: 80, color: colors.error, mb: 3 }} />
            <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
              {errorMessage}
            </Typography>
            <Button
              variant="contained"
              href="/"
              sx={{
                bgcolor: colors.accent,
                color: colors.textOnLight,
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: colors.accentDark },
              }}
            >
              Back to Home
            </Button>
          </Box>
        )}

        {!status && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
              Stay Updated
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
              Want to hear about new features and updates? Create an account to subscribe to our updates.
            </Typography>
            <Button
              variant="contained"
              href="/register"
              sx={{
                bgcolor: colors.accent,
                color: colors.textOnLight,
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: colors.accentDark },
              }}
            >
              Get Started
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
