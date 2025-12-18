import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { OnboardingWizard, OnboardingData } from '../components/Onboarding';
import { setToken } from '@/utils/auth';
import { getCsrfToken, fetchCsrfToken, api } from '@/utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';
import { colors } from '@/styles/colors';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegistrationComplete = async (data: OnboardingData) => {
    try {
      setIsRegistering(true);
      console.log('Registration/Onboarding completed with data:', data);

      // Generate slug from username (same logic as original registration form)
      const generateSlug = (username: string) => {
        return username.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      };

      // Get CSRF token for the request
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();

      // Handle studio registration differently
      if (data.userType === 'studio') {
        await handleStudioRegistration(data, generateSlug, csrfToken);
        return;
      }

      // Standard user/artist registration
      const registrationPayload = {
        name: data.userDetails?.name || '',
        username: data.userDetails?.username || '',
        slug: generateSlug(data.userDetails?.username || ''),
        email: data.credentials?.email || '',
        password: data.credentials?.password || '',
        password_confirmation: data.credentials?.password_confirmation || '',
        bio: data.userDetails?.bio || '',
        location: data.userDetails?.location || '',
        location_lat_long: data.userDetails?.locationLatLong || '',
        type: data.userType === 'client' ? 'user' : data.userType,
        selected_styles: data.selectedStyles,
        preferred_styles: data.preferredStyles || [],
        experience_level: data.experienceLevel,
      };

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

        // Set the authentication token if provided
        if (result.token) {
          console.log('Setting token and refreshing auth state');
          setToken(result.token);

          // Clear the API cache to ensure fresh user data
          api.clearUserCache();

          // Wait a moment for token to be set properly
          await new Promise(resolve => setTimeout(resolve, 200));

          // Refresh the auth context to load the user data
          try {
            await refreshUser();
            console.log('User authenticated and loaded in context');
          } catch (authError) {
            console.error('Failed to load user after registration:', authError);
            // Continue anyway, user is created successfully
          }
        }

        // Handle profile image upload if provided
        if (data.userDetails?.profileImage && result.user?.id) {
          try {
            const imageFormData = new FormData();
            imageFormData.append('profile_photo', data.userDetails.profileImage);

            // Use the api utility which handles CSRF tokens properly for FormData
            await api.post('/users/profile-photo', imageFormData);
            console.log('Profile image uploaded successfully');
          } catch (imgErr) {
            console.error('Failed to upload profile image:', imgErr);
            // Continue with registration even if image upload fails
          }
        }

        // Redirect to appropriate page based on user type
        const redirectPath = data.userType === 'artist' ? '/profile' : '/';
        router.push(redirectPath);

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

  // Handle studio registration - creates owner account first, then studio
  const handleStudioRegistration = async (
    data: OnboardingData,
    generateSlug: (username: string) => string,
    csrfToken: string | null
  ) => {
    try {
      const studioOwner = data.studioOwner;
      let ownerId: number | undefined;

      // Step 1: Create or identify the owner account
      if (studioOwner?.hasExistingAccount && studioOwner.existingAccountId) {
        // User has an existing account - they'll need to login
        // For now, we'll use their existing account ID
        ownerId = studioOwner.existingAccountId;
        console.log('Using existing account as owner:', ownerId);
      } else {
        // Create a new user account for the owner using their personal profile info
        const ownerType = studioOwner?.ownerType || 'user';
        const isArtistOwner = ownerType === 'artist';

        // userDetails now contains the owner's personal info
        const ownerPayload = {
          name: data.userDetails?.name || '',
          username: data.userDetails?.username || '',
          slug: generateSlug(data.userDetails?.username || ''),
          email: data.credentials?.email || '',
          password: data.credentials?.password || '',
          password_confirmation: data.credentials?.password_confirmation || '',
          about: data.userDetails?.bio || '',
          location: data.userDetails?.location || '',
          location_lat_long: data.userDetails?.locationLatLong || '',
          type: ownerType, // 'artist' or 'user' based on their selection
          // Artist-specific fields from the styles selection step
          selected_styles: isArtistOwner ? (studioOwner?.artistStyles || []) : [],
          preferred_styles: [],
          is_studio_owner: true, // Flag to indicate this user owns a studio
        };

        console.log('Creating owner account with payload:', ownerPayload);

        const ownerResponse = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken || '',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify(ownerPayload),
        });

        if (!ownerResponse.ok) {
          const errorData = await ownerResponse.json();
          throw new Error(errorData.message || 'Failed to create owner account');
        }

        const ownerResult = await ownerResponse.json();
        console.log('Owner account created:', ownerResult);
        ownerId = ownerResult.user?.id;

        // Set the authentication token
        if (ownerResult.token) {
          setToken(ownerResult.token);
          api.clearUserCache();
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Handle owner profile image upload if provided
        if (data.userDetails?.profileImage && ownerId) {
          try {
            const imageFormData = new FormData();
            imageFormData.append('profile_photo', data.userDetails.profileImage);

            await api.post('/users/profile-photo', imageFormData);
            console.log('Owner profile image uploaded successfully');
          } catch (imgErr) {
            console.error('Failed to upload owner profile image:', imgErr);
          }
        }
      }

      // Step 2: Create the studio with the owner_id
      // studioDetails contains the studio-specific info
      const studioPayload: Record<string, unknown> = {
        name: data.studioDetails?.name || '',
        slug: generateSlug(data.studioDetails?.username || data.studioDetails?.name || ''),
        about: data.studioDetails?.bio || '',
        location: data.studioDetails?.location || '',
        location_lat_long: data.studioDetails?.locationLatLong || '',
        owner_id: ownerId,
      };

      // Add optional email if provided
      if (data.studioDetails?.email) {
        studioPayload.email = data.studioDetails.email;
      }

      // Add optional phone if provided
      if (data.studioDetails?.phone) {
        studioPayload.phone = data.studioDetails.phone;
      }

      console.log('Creating studio with payload:', studioPayload);

      const studioResponse = await api.post('/studios', studioPayload);
      console.log('Studio created:', studioResponse);

      // Handle studio image upload if provided
      const studioId = studioResponse?.studio?.id;
      if (data.studioDetails?.profileImage && studioId) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', data.studioDetails.profileImage);

          await api.post(`/studios/${studioId}/image`, imageFormData);
          console.log('Studio image uploaded successfully');
        } catch (imgErr) {
          console.error('Failed to upload studio image:', imgErr);
        }
      }

      // Refresh auth context to get updated user data with is_studio_admin
      try {
        await refreshUser();
        console.log('User authenticated and loaded in context');
      } catch (authError) {
        console.error('Failed to load user after studio creation:', authError);
      }

      // Redirect to studio dashboard or profile
      router.push('/dashboard');

    } catch (error) {
      console.error('Error during studio registration:', error);
      throw error;
    }
  };

  const handleRegistrationCancel = () => {
    router.push('/');
  };

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