import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { colors } from '@/styles/colors';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { setToken } from '@/utils/auth';
import { authService } from '@/services/authService';
import { api } from '@/utils/api';

type Status = 'pending' | 'verifying' | 'verified' | 'already_verified' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshUser, setUserDirectly } = useAuth();
  const [status, setStatus] = useState<Status>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>('/dashboard');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const verifyUrl = router.query.url as string | undefined;
    const emailFromUrl = router.query.email as string | undefined;

    // Store email from URL for resend functionality
    if (emailFromUrl) {
      setResendEmail(emailFromUrl);
    }

    // If there's a verification URL, attempt to verify
    if (verifyUrl) {
      handleVerification(verifyUrl);
    }
  }, [router.isReady, router.query]);

  const handleVerification = async (verifyUrl: string) => {
    setStatus('verifying');
    setErrorMessage(null);

    try {
      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.message || 'Verification failed. Please try again.');
        return;
      }

      // Set redirect URL from response
      if (data.redirect_url) {
        setRedirectUrl(data.redirect_url);
      }

      // Update auth token and user
      if (data.token) {
        setToken(data.token);
        api.clearUserCache();
        if (data.user) {
          setUserDirectly(data.user);
        } else {
          await refreshUser();
        }
      }

      if (data.already_verified) {
        setStatus('already_verified');
      } else {
        setStatus('verified');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again or contact support.');
    }
  };

  const handleResendEmail = async () => {
    const emailToUse = user?.email || resendEmail;
    if (!emailToUse || !emailToUse.trim()) {
      alert('Unable to resend email. Please try registering again or contact support.');
      return;
    }
    setResendLoading(true);
    try {
      await authService.sendVerificationNotification(emailToUse);
      alert('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      alert(error.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    router.push(redirectUrl);
  };

  return (
    <>
      <Head>
        <title>Verify Email - InkedIn</title>
        <meta name="description" content="Verify your email address to complete your InkedIn account setup" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
        <Navbar />

        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          {/* Pending - waiting for user to check email */}
          {status === 'pending' && (
            <Box sx={{ mt: 4 }}>
              <MailOutlineIcon sx={{ fontSize: 80, color: colors.accent, mb: 3 }} />
              <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
                You're almost done!
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 3, fontSize: '1.1rem' }}>
                Verify your email to start using the site.
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textMuted, mb: 4, lineHeight: 1.6 }}>
                We've sent a verification link to your email address. Click the link in the email to verify your account.
                <br /><br />
                <strong>Can't find the email?</strong> Check your spam or junk folder.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleResendEmail}
                sx={{
                  color: colors.accent,
                  borderColor: colors.accent,
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: colors.accentDark, bgcolor: 'rgba(212, 168, 83, 0.1)' },
                }}
              >
                Resend Verification Email
              </Button>
            </Box>
          )}

          {/* Verifying - loading state */}
          {status === 'verifying' && (
            <Box sx={{ mt: 4 }}>
              <CircularProgress size={60} sx={{ color: colors.accent, mb: 3 }} />
              <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                Verifying your email...
              </Typography>
            </Box>
          )}

          {/* Verified successfully */}
          {status === 'verified' && (
            <Box sx={{ mt: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: colors.success, mb: 3 }} />
              <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
                Email Verified!
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
                Your email has been verified successfully. You're all set to start using InkedIn!
              </Typography>
              <Button
                variant="contained"
                onClick={handleContinue}
                sx={{
                  bgcolor: colors.accent,
                  color: colors.textOnLight,
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: colors.accentDark },
                }}
              >
                Continue
              </Button>
            </Box>
          )}

          {/* Already verified */}
          {status === 'already_verified' && (
            <Box sx={{ mt: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: colors.success, mb: 3 }} />
              <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
                Already Verified
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
                Your email address has already been verified. You can continue using InkedIn.
              </Typography>
              <Button
                variant="contained"
                onClick={handleContinue}
                sx={{
                  bgcolor: colors.accent,
                  color: colors.textOnLight,
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: colors.accentDark },
                }}
              >
                Continue
              </Button>
            </Box>
          )}

          {/* Error state */}
          {status === 'error' && (
            <Box sx={{ mt: 4 }}>
              <ErrorIcon sx={{ fontSize: 80, color: colors.error, mb: 3 }} />
              <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 2 }}>
                Verification Failed
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, fontSize: '1.1rem' }}>
                {errorMessage}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  sx={{
                    bgcolor: colors.accent,
                    color: colors.textOnLight,
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: colors.accentDark },
                  }}
                >
                  {resendLoading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                </Button>
                <Button
                  variant="outlined"
                  href="/"
                  sx={{
                    color: colors.textSecondary,
                    borderColor: colors.textSecondary,
                    px: 4,
                    py: 1.5,
                    '&:hover': { borderColor: colors.textPrimary, bgcolor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  Back to Home
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
