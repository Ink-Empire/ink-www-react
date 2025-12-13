import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { OnboardingWizard, OnboardingData } from '../components/Onboarding';
import { useAuth } from '../contexts/AuthContext';
import { getToken, setToken } from '../utils/auth';
import { api, getCsrfToken, fetchCsrfToken } from '../utils/api';
import { Box, CircularProgress, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initialUserType, setInitialUserType] = useState<'client' | 'artist' | 'studio' | null>(null);

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        // Handle authentication token from registration
        const { token, userId } = router.query;
        
        if (token && typeof token === 'string') {
          console.log('Setting auth token from registration flow');
          setToken(token);
          
          // Wait a bit for auth context to update
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Get user type from registration flow
        const storedUserType = localStorage.getItem('onboarding_user_type');
        if (storedUserType) {
          // Map registration types to Onboarding types
          const typeMapping: Record<string, 'client' | 'artist' | 'studio'> = {
            'user': 'client',
            'artist': 'artist', 
            'studio': 'studio'
          };
          setInitialUserType(typeMapping[storedUserType] || 'client');
          // Clean up localStorage
          localStorage.removeItem('onboarding_user_type');
        }
        
      } catch (error) {
        console.error('Error initializing Onboarding:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeOnboarding();
  }, [router.query]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      console.log('Onboarding completed with data:', data);
      
      // Prepare form data for API submission
      const formData = new FormData();
      formData.append('user_type', data.userType || '');
      if (data.experienceLevel) {
        formData.append('experience_level', data.experienceLevel);
      }
      formData.append('selected_styles', JSON.stringify(data.selectedStyles));
      
      if (data.userDetails) {
        formData.append('bio', data.userDetails.bio);
        formData.append('display_name', data.userDetails.name);
        formData.append('username_display', data.userDetails.username);
        
        if (data.userDetails.profileImage) {
          formData.append('profile_image', data.userDetails.profileImage);
        }
      }
      
      // Get CSRF token for the request
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();
      
      // Submit Onboarding data to API
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${getToken()}`
        },
        credentials: 'include',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Onboarding saved successfully:', result);
        
        // Redirect to appropriate page based on user type
        const redirectPath = data.userType === 'artist' ? '/profile' : '/';
        router.push(redirectPath);
      } else {
        throw new Error('Failed to save Onboarding data');
      }
    } catch (error) {
      console.error('Error completing Onboarding:', error);
      // Even if API fails, redirect to home - Onboarding is not critical
      router.push('/');
    }
  };

  const handleOnboardingCancel = () => {
    // Redirect back to home or login page
    router.push('/');
  };

  // Show loading while initializing
  if (isInitializing) {
    return (
      <>
        <Head>
          <title>Welcome to InkedIn | Get Started</title>
          <meta name="description" content="Set up your InkedIn profile and join the tattoo community" />
          <link rel="icon" href="/assets/img/logo.png" />
        </Head>
        
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
            color: 'white',
          }}
        >
          <CircularProgress sx={{ color: colors.accent, mb: 2 }} size={60} />
          <Typography variant="h6" sx={{ color: colors.textSecondary }}>
            Setting up your profile...
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Welcome to InkedIn | Get Started</title>
        <meta name="description" content="Set up your InkedIn profile and join the tattoo community" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        onCancel={handleOnboardingCancel}
        initialUserType={initialUserType}
      />
    </>
  );
};

export default OnboardingPage;