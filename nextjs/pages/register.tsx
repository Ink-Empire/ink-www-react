import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { OnboardingWizard, OnboardingData } from '../components/Onboarding';
import { removeToken } from '@/utils/auth';
import { getCsrfToken, fetchCsrfToken, api } from '@/utils/api';
import { uploadImageToS3 } from '@/utils/s3Upload';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';
import { colors } from '@/styles/colors';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isClearing, setIsClearing] = useState(true);

  // Clear any existing auth state when visiting the register page
  // This ensures new registrations start with a clean slate
  useEffect(() => {
    let mounted = true;

    const clearAuth = async () => {
      // Call logout API to clear server session (don't use AuthContext logout which redirects)
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
      } catch (e) {
        // Ignore - user might not have been logged in
      }

      // Clear localStorage auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('csrf_token');
        removeToken();
      }

      // Get a fresh CSRF token for the new session
      try {
        await fetch('/sanctum/csrf-cookie', {
          method: 'GET',
          credentials: 'include',
        });
        console.log('Fresh CSRF token obtained');
      } catch (e) {
        console.log('Could not get fresh CSRF token');
      }

      if (mounted) {
        setIsClearing(false);
      }
    };

    clearAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Generate slug from username
  const generateSlug = useCallback((username: string) => {
    return username.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const handleRegistrationComplete = async (data: OnboardingData) => {
    try {
      setIsRegistering(true);
      console.log('Registration/Onboarding completed with data:', data);

      // Get CSRF token for the request
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();

      // Handle studio registration - simplified flow
      if (data.userType === 'studio') {
        // If user logged in with existing account, create studio and redirect to dashboard
        if (data.studioOwner?.isAuthenticated && data.studioOwner?.existingAccountId) {
          console.log('Studio flow: existing user creating studio...');

          // Create the studio for the authenticated user
          const studioPayload: Record<string, unknown> = {
            name: data.studioDetails?.name || '',
            slug: generateSlug(data.studioDetails?.username || data.studioDetails?.name || ''),
            about: data.studioDetails?.bio || '',
            location: data.studioDetails?.location || '',
            location_lat_long: data.studioDetails?.locationLatLong || '',
            owner_id: data.studioOwner.existingAccountId,
          };

          if (data.studioDetails?.email) {
            studioPayload.email = data.studioDetails.email;
          }
          if (data.studioDetails?.phone) {
            studioPayload.phone = data.studioDetails.phone;
          }

          const studioResponse = await api.post('/studios', studioPayload) as { studio?: { id?: number } };
          console.log('Studio created:', studioResponse);

          // Handle studio image upload
          const studioId = studioResponse?.studio?.id;
          if (data.studioDetails?.profileImage && studioId) {
            try {
              const uploadedImage = await uploadImageToS3(data.studioDetails.profileImage, 'studio');
              await api.post(`/studios/${studioId}/image`, { image_id: uploadedImage.id });
              console.log('Studio image uploaded');
            } catch (imgErr) {
              console.error('Failed to upload studio image:', imgErr);
            }
          }

          // Refresh user and redirect to dashboard
          await refreshUser();
          router.push('/dashboard');
          return;
        }

        // New user creating studio - register user and create studio
        console.log('Studio flow: new user registration with studio...');

        // Register the user account
        const registrationPayload = {
          name: data.studioDetails?.name || '', // Use studio name as account name
          username: data.studioDetails?.username || '',
          slug: generateSlug(data.studioDetails?.username || ''),
          email: data.studioDetails?.email || '',
          password: data.studioDetails?.password || '',
          password_confirmation: data.studioDetails?.password_confirmation || '',
          about: data.studioDetails?.bio || '',
          location: data.studioDetails?.location || '',
          location_lat_long: data.studioDetails?.locationLatLong || '',
          type: 'studio',
        };

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken || '',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify(registrationPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create account');
        }

        const result = await response.json();
        console.log('Registration result:', result);

        // Store pending studio data for after email verification
        if (data.studioDetails) {
          localStorage.setItem('pendingStudioData', JSON.stringify({
            ...data.studioDetails,
            // Don't store password
            password: undefined,
            password_confirmation: undefined,
          }));
          console.log('Stored pending studio data for after email verification');
        }

        // Redirect to verify email
        const email = result.email || data.studioDetails?.email || '';
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Standard user/artist registration
      const registrationPayload: Record<string, unknown> = {
        name: data.userDetails?.name || '',
        username: data.userDetails?.username || '',
        slug: generateSlug(data.userDetails?.username || ''),
        email: data.credentials?.email || '',
        password: data.credentials?.password || '',
        password_confirmation: data.credentials?.password_confirmation || '',
        about: data.userDetails?.bio || '',
        location: data.userDetails?.location || '',
        location_lat_long: data.userDetails?.locationLatLong || '',
        type: data.userType === 'client' ? 'user' : data.userType,
        selected_styles: data.selectedStyles,
        preferred_styles: data.preferredStyles || [],
        experience_level: data.experienceLevel,
      };

      // Add studio affiliation for artists
      if (data.userType === 'artist' && data.userDetails?.studioAffiliation) {
        registrationPayload.studio_id = data.userDetails.studioAffiliation.studioId;
      }

      // Create the user account
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(registrationPayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Registration successful:', result);

        // TODO: Profile image and tattoo lead creation will be handled after email verification
        // when the user completes their first login

        // Redirect to verify email page with email for resend functionality
        const email = encodeURIComponent(result.email || data.credentials?.email || '');
        router.push(`/verify-email?email=${email}`);

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Error completing registration:', error);
      // TODO: Show error message to user
    } finally {
      setIsRegistering(false);
    }
  };
  const handleRegistrationCancel = () => {
    router.push('/');
  };

  // Show loading while clearing previous auth state
  if (isClearing) {
    return (
      <>
        <Head>
          <title>Join InkedIn | Sign Up</title>
          <meta name="description" content="Join the InkedIn community and connect with tattoo artists and enthusiasts" />
          <link rel="icon" href="/assets/img/logo.png" />
        </Head>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
          }}
        >
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Join InkedIn | Sign Up</title>
        <meta name="description" content="Join the InkedIn community and connect with tattoo artists and enthusiasts" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <OnboardingWizard
        onComplete={handleRegistrationComplete}
        onCancel={handleRegistrationCancel}
      />

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: colors.accent,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(26, 14, 17, 0.8)',
        }}
        open={isRegistering}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={60} sx={{ color: colors.accent }} />
          <Typography
            variant="h6"
            sx={{
              color: colors.textSecondary,
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            Creating your account...
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.textSecondary,
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            Please wait while we set up your profile
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
};

export default RegisterPage;