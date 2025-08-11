import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { OnboardingWizard, OnboardingData } from '../components/onboarding';
import { setToken } from '@/utils/auth';
import { getCsrfToken, fetchCsrfToken } from '@/utils/api';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { fetchCurrentUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegistrationComplete = async (data: OnboardingData) => {
    try {
      setIsRegistering(true);
      console.log('Registration/onboarding completed with data:', data);
      
      // Generate slug from username (same logic as original registration form)
      const generateSlug = (username: string) => {
        return username.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      };

      // Create the user account first
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

      // Get CSRF token for the request
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();

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
          setToken(result.token);
          
          // Refresh the auth context to load the user data
          try {
            await fetchCurrentUser();
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
            
            const imageResponse = await fetch(`/api/users/profile-photo`, {
              method: 'POST',
              body: imageFormData,
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${result.token}`,
                'X-XSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
              }
            });
            
            if (imageResponse.ok) {
              console.log('Profile image uploaded successfully');
            }
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
    </>
  );
};

export default RegisterPage;