import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { OnboardingWizard, OnboardingData, UserRegistrationPayload, StudioCreationPayload } from '../components/Onboarding';
import { setToken, removeToken } from '@/utils/auth';
import { getCsrfToken, fetchCsrfToken, api } from '@/utils/api';
import { uploadImageToS3 } from '@/utils/s3Upload';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';
import { colors } from '@/styles/colors';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { refreshUser, logout, setUserDirectly } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isClearing, setIsClearing] = useState(true);
  // Track if user was already registered via early registration flow
  const [earlyRegisteredUserId, setEarlyRegisteredUserId] = useState<number | null>(null);

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

  // Early registration callback - called after AccountSetup for studios
  // This registers the user immediately so the final step is just creating the studio
  const handleRegisterUser = useCallback(async (payload: UserRegistrationPayload): Promise<{ userId: number; token: string }> => {
    console.log('Early registration: Creating user account...', payload);

    // Get CSRF token for the request
    await fetchCsrfToken();
    const csrfToken = getCsrfToken();

    const ownerType = payload.studioOwner?.ownerType || 'user';
    const isArtistOwner = ownerType === 'artist';

    const registrationPayload = {
      name: payload.userDetails?.name || '',
      username: payload.userDetails?.username || '',
      slug: generateSlug(payload.userDetails?.username || ''),
      email: payload.credentials?.email || '',
      password: payload.credentials?.password || '',
      password_confirmation: payload.credentials?.password_confirmation || '',
      about: payload.userDetails?.bio || '',
      location: payload.userDetails?.location || '',
      location_lat_long: payload.userDetails?.locationLatLong || '',
      type: ownerType,
      selected_styles: isArtistOwner ? (payload.studioOwner?.artistStyles || []) : [],
      preferred_styles: [],
      is_studio_owner: true,
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
    console.log('Early registration: User created successfully', result);

    // Set the authentication token and user
    if (result.token) {
      setToken(result.token);
      api.clearUserCache();

      if (result.user && result.user.id) {
        setUserDirectly(result.user);
        console.log('Early registration: User set in context');
      }
    }

    // Handle owner profile image upload if provided - use presigned URLs for speed
    if (payload.userDetails?.profileImage && result.user?.id) {
      try {
        console.log('Early registration: Uploading profile image via presigned URL...');
        const uploadedImage = await uploadImageToS3(payload.userDetails.profileImage, 'profile');
        // Associate the uploaded image with the user
        await api.post('/users/profile-photo', { image_id: uploadedImage.id });
        console.log('Early registration: Profile image uploaded via presigned URL');
      } catch (imgErr) {
        console.error('Early registration: Failed to upload profile image:', imgErr);
      }
    }

    setEarlyRegisteredUserId(result.user?.id);

    return {
      userId: result.user?.id,
      token: result.token,
    };
  }, [generateSlug, setUserDirectly]);

  // Studio creation callback - called from StudioDetails
  const handleCreateStudio = useCallback(async (payload: StudioCreationPayload): Promise<{ studioId: number }> => {
    console.log('Creating studio...', payload);

    const studioPayload: Record<string, unknown> = {
      name: payload.studioDetails?.name || '',
      slug: generateSlug(payload.studioDetails?.username || payload.studioDetails?.name || ''),
      about: payload.studioDetails?.bio || '',
      location: payload.studioDetails?.location || '',
      location_lat_long: payload.studioDetails?.locationLatLong || '',
      owner_id: payload.ownerId,
    };

    if (payload.studioDetails?.email) {
      studioPayload.email = payload.studioDetails.email;
    }

    if (payload.studioDetails?.phone) {
      studioPayload.phone = payload.studioDetails.phone;
    }

    const studioResponse = await api.post('/studios', studioPayload) as { studio?: { id?: number } };
    console.log('Studio created:', studioResponse);

    const studioId = studioResponse?.studio?.id;

    // Handle studio image upload if provided - use presigned URLs for speed
    if (payload.studioDetails?.profileImage && studioId) {
      try {
        console.log('Uploading studio image via presigned URL...');
        const uploadedImage = await uploadImageToS3(payload.studioDetails.profileImage, 'studio');
        // Associate the uploaded image with the studio
        await api.post(`/studios/${studioId}/image`, { image_id: uploadedImage.id });
        console.log('Studio image uploaded via presigned URL');
      } catch (imgErr) {
        console.error('Failed to upload studio image:', imgErr);
      }
    }

    // Refresh user to get studio relationship
    try {
      await refreshUser();
      console.log('User refreshed with studio data');
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }

    return { studioId: studioId || 0 };
  }, [generateSlug, refreshUser]);

  const handleRegistrationComplete = async (data: OnboardingData) => {
    try {
      setIsRegistering(true);
      console.log('Registration/Onboarding completed with data:', data);

      // Get CSRF token for the request
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();

      // Handle studio registration
      if (data.userType === 'studio') {
        // If user was already registered via early registration AND studio was created,
        // just redirect - everything is done
        if (earlyRegisteredUserId) {
          console.log('Studio flow complete - user and studio already created, redirecting...');
          router.push('/dashboard');
          return;
        }

        // If user logged in with existing account AND studio was created, redirect
        if (data.studioOwner?.isAuthenticated && data.studioOwner?.existingAccountId) {
          console.log('Studio flow complete - existing user, studio created, redirecting...');
          router.push('/dashboard');
          return;
        }

        // Fallback to legacy flow (shouldn't happen with new callbacks)
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
        about: data.userDetails?.bio || '',
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

          // Set the new auth token
          setToken(result.token);

          // Clear the API cache to ensure fresh user data
          api.clearUserCache();

          // Set user directly from registration response
          if (result.user && result.user.id) {
            setUserDirectly(result.user);
            console.log('User set directly from registration response');
          } else {
            // Fallback to refreshUser if user data not in response
            try {
              await refreshUser();
              console.log('User authenticated and loaded in context');
            } catch (authError) {
              console.error('Failed to load user after registration:', authError);
            }
          }
        }

        // Handle profile image upload if provided - use presigned URLs for speed
        if (data.userDetails?.profileImage && result.user?.id) {
          try {
            console.log('Uploading profile image via presigned URL...');
            const uploadedImage = await uploadImageToS3(data.userDetails.profileImage, 'profile');
            // Associate the uploaded image with the user
            await api.post('/users/profile-photo', { image_id: uploadedImage.id });
            console.log('Profile image uploaded via presigned URL');

            // Refresh user data to include the newly uploaded image
            await refreshUser();
            console.log('User refreshed with new image');
          } catch (imgErr) {
            console.error('Failed to upload profile image:', imgErr);
            // Continue with registration even if image upload fails
          }
        }

        // Create tattoo lead for clients with intent data
        if (data.userType === 'client' && data.tattooIntent && data.tattooIntent.timing) {
          try {
            console.log('Creating tattoo lead...');
            await api.post('/leads', {
              timing: data.tattooIntent.timing,
              allow_artist_contact: data.tattooIntent.allowArtistContact,
              style_ids: data.selectedStyles,
              tag_ids: data.tattooIntent.selectedTags,
              custom_themes: data.tattooIntent.customThemes || [],
              description: data.tattooIntent.description || '',
            });
            console.log('Tattoo lead created successfully');
          } catch (leadErr) {
            console.error('Failed to create tattoo lead:', leadErr);
            // Continue even if lead creation fails
          }
        }

        // Redirect to appropriate page based on user type
        if (data.userType === 'artist') {
          router.push('/dashboard');
        } else if (data.userType === 'client' && data.selectedStyles && data.selectedStyles.length > 0) {
          // For clients with selected styles, redirect to tattoos page with filters
          const params = new URLSearchParams();
          params.set('styles', data.selectedStyles.join(','));

          // If they have a location, add location filter with 50 mile radius
          if (data.userDetails?.locationLatLong) {
            params.set('locationCoords', data.userDetails.locationLatLong);
            params.set('distance', '50');
            params.set('newUser', 'true'); // Flag to enable fallback if no results
          }

          router.push(`/tattoos?${params.toString()}`);
        } else {
          router.push('/');
        }

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
      if (studioOwner?.isAuthenticated && studioOwner.existingAccountId) {
        // User is already logged in from the StudioOwnerCheck step
        // No need to create an account or log them in again
        ownerId = studioOwner.existingAccountId;
        console.log('User already authenticated, using existing account as owner:', ownerId);
      } else if (studioOwner?.hasExistingAccount && studioOwner.existingAccountId) {
        // Legacy flow - user has existing account but not authenticated
        // This shouldn't happen with the new flow, but keeping for safety
        ownerId = studioOwner.existingAccountId;
        console.log('Using existing account as owner (legacy):', ownerId);
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

        // Set the authentication token and user
        if (ownerResult.token) {
          setToken(ownerResult.token);
          api.clearUserCache();

          // Set user directly from registration response
          if (ownerResult.user && ownerResult.user.id) {
            setUserDirectly(ownerResult.user);
            console.log('Owner user set directly from registration response');
          }
        }

        // Handle owner profile image upload if provided - use presigned URLs for speed
        if (data.userDetails?.profileImage && ownerId) {
          try {
            console.log('Uploading owner profile image via presigned URL...');
            const uploadedImage = await uploadImageToS3(data.userDetails.profileImage, 'profile');
            await api.post('/users/profile-photo', { image_id: uploadedImage.id });
            console.log('Owner profile image uploaded via presigned URL');
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

      const studioResponse = await api.post('/studios', studioPayload) as { studio?: { id?: number } };
      console.log('Studio created:', studioResponse);

      // Handle studio image upload if provided - use presigned URLs for speed
      const studioId = studioResponse?.studio?.id;
      if (data.studioDetails?.profileImage && studioId) {
        try {
          console.log('Uploading studio image via presigned URL...');
          const uploadedImage = await uploadImageToS3(data.studioDetails.profileImage, 'studio');
          await api.post(`/studios/${studioId}/image`, { image_id: uploadedImage.id });
          console.log('Studio image uploaded via presigned URL');
        } catch (imgErr) {
          console.error('Failed to upload studio image:', imgErr);
        }
      }

      // Refresh user data to get complete user info including any uploaded images
      // and the newly created studio relationship
      try {
        await refreshUser();
        console.log('User refreshed with complete data including images');
      } catch (e) {
        console.error('Failed to refresh user:', e);
        // Fallback: manually update the user data with studio info
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          try {
            const userData = JSON.parse(currentUser);
            const updatedUser = {
              ...userData,
              is_studio_admin: true,
              studio_id: studioId,
              owned_studio: {
                id: studioId,
                name: data.studioDetails?.name || '',
                slug: generateSlug(data.studioDetails?.username || data.studioDetails?.name || ''),
              },
            };
            setUserDirectly(updatedUser);
            console.log('User updated with studio admin info (fallback)');
          } catch (parseErr) {
            console.error('Failed to update user with studio info:', parseErr);
          }
        }
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
        onRegisterUser={handleRegisterUser}
        onCreateStudio={handleCreateStudio}
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