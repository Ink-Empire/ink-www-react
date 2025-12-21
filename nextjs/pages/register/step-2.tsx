import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useUser } from '@/contexts/AuthContext';
import { api, getCsrfToken, fetchCsrfToken } from '@/utils/api';
import { getToken, setToken } from '@/utils/auth';
import StyleModal from '@/components/StyleModal';
import { useStyles } from '@/contexts/StyleContext';

type FormValues = {
  bio: string;
  website: string;
  instagram: string;
  twitter: string;
  facebook: string;
  profileImage: FileList;
};

const RegisterStepTwo: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;
  const { updateUser, updateStyles } = useUser();
  const { styles } = useStyles();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();
  
  // Get current user ID and ensure auth token is set on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First, fetch a CSRF token
        console.log('Fetching CSRF token for registration step 2');
        await fetchCsrfToken();
        
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the CSRF token from cookies
        const csrfToken = getCsrfToken();
        console.log('CSRF token available:', csrfToken ? 'Yes' : 'No');
        
        // First check URL query parameters for userId (highest priority)
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('userId');
        
        if (urlUserId) {
          console.log('Found user ID in URL parameters:', urlUserId);
          setUserId(parseInt(urlUserId, 10));
          return;
        }
        
        // Debug localStorage contents related to auth
        console.log('DEBUG: Checking all auth-related localStorage items:');
        if (typeof window !== 'undefined') {
          console.log('- auth_token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
          console.log('- user_data:', localStorage.getItem('user_data') ? 'Present' : 'Missing');
          console.log('- user_id:', localStorage.getItem('user_id') ? 'Present' : 'Missing');
        }
        
        // Check if we have an auth token
        let token = getToken();
        console.log('Auth token from getToken():', token ? 'Present' : 'Missing');
        
        // If token is not in auth storage, check if it was passed in URL from step 1
        if (!token && typeof window !== 'undefined') {
          // Check for token in query params
          const urlToken = urlParams.get('token');
          
          if (urlToken) {
            console.log('Found token in URL parameters, setting in storage:', urlToken.substring(0, 10) + '...');
            setToken(urlToken);
            token = urlToken;
          }
        }
        
        // If no token found anywhere, look for it in localStorage directly
        if (!token && typeof window !== 'undefined') {
          const directToken = localStorage.getItem('auth_token');
          if (directToken) {
            console.log('Found token in localStorage directly, setting via auth util:', directToken.substring(0, 10) + '...');
            setToken(directToken);
            token = directToken;
          }
        }
        
        // After all token retrieval attempts, log the final status
        if (token) {
          console.log('Final token status: FOUND - proceeding with authentication');
        } else {
          console.error('Final token status: NOT FOUND - this will cause 401 errors');
        }
        
        // Try to get user ID from localStorage as a fallback
        const userIdFromLocalStorage = localStorage.getItem('user_id');
        if (userIdFromLocalStorage) {
          setUserId(parseInt(userIdFromLocalStorage, 10));
          console.log('Found user ID in localStorage key:', userIdFromLocalStorage);
          return;
        }
        
        // If we have a token but can't find user ID, try to fetch from API
        if (token) {
          try {
            console.log('Fetching user data from API with auth token');
            // Response could be user directly or wrapped
            interface UserResponse {
              id?: number;
              user?: { id: number };
              data?: { id: number };
            }
            const response = await api.get<UserResponse>('/users/me', {
              requiresAuth: true,
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            console.log('API response from /users/me:', response);

            // The API might return response.id directly or it could be in response.user.id
            if (response && response.id) {
              setUserId(response.id);
              console.log('Successfully fetched user data from API, user ID:', response.id);
            } else if (response && response.user && response.user.id) {
              setUserId(response.user.id);
              console.log('Successfully fetched user data from API (nested), user ID:', response.user.id);
            } else if (response && response.data && response.data.id) {
              setUserId(response.data.id);
              console.log('Successfully fetched user data from API (in data), user ID:', response.data.id);
            } else {
              console.error('User ID not found in API response. Full response:', JSON.stringify(response));
              throw new Error('User ID not found in API response');
            }
          } catch (apiErr) {
            console.error('Failed to fetch user from API:', apiErr);
            throw new Error('Unable to get user ID from API');
          }
        } else {
          throw new Error('Authentication token not found');
        }
      } catch (err) {
        console.error('Failed to get user data:', err);
        setError('Unable to retrieve your account information. Please try again or go back to the first registration step.');
      }
    };
    
    fetchUserData();
  }, [router.query]);
  
  // Watch for file input changes to create preview
  const watchProfileImage = watch("profileImage");
  
  useEffect(() => {
    if (watchProfileImage && watchProfileImage.length > 0) {
      const file = watchProfileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [watchProfileImage]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch a fresh CSRF token before submitting
      console.log('Fetching fresh CSRF token before form submission');
      await fetchCsrfToken();
      
      // Short delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the CSRF token from cookies
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        console.warn('No CSRF token found before submission, this might cause a 419 error');
      } else {
        console.log('CSRF token is available for submission');
      }
      
      if (!userId) {
        // Try one more time to check URL parameters - this is necessary for when coming directly to this page
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('userId');
        
        if (urlUserId) {
          console.log('Found user ID in URL parameters on submit:', urlUserId);
          setUserId(parseInt(urlUserId, 10));
        } else {
          console.error('No user ID found for submission. URL params:', urlParams.toString());
          throw new Error('User ID not found. Please try logging out and back in.');
        }
      }
      
      // Create the payload
      const payload: any = {
        bio: data.bio,
        about: data.bio, // Use both fields to ensure compatibility
        social_media: {
          website: data.website || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
        },
      };
      
      // Add selected styles for artists
      if (type === 'artist' && selectedStyles.length > 0) {
        payload.styles = selectedStyles;
      }

      // Add profile image if provided
      if (data.profileImage && data.profileImage.length > 0) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('profile_photo', data.profileImage[0]);
        
        try {
          // Get the authentication token and CSRF token
          const authToken = getToken();
          const csrfToken = getCsrfToken();
          
          // First upload the profile image
          const imageResponse = await fetch(`/api/users/profile-photo`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'X-XSRF-TOKEN': csrfToken || '',
              'X-Requested-With': 'XMLHttpRequest' // This is important for Laravel to recognize the request as AJAX
            }
          });
          
          if (imageResponse.ok) {
            payload.has_profile_image = true;
            const imageData = await imageResponse.json();
            if (imageData?.filepath) {
              payload.profile_photo = imageData.filepath;
            }
          }
        } catch (imgErr) {
          console.error('Failed to upload profile image:', imgErr);
          // Continue with the rest of the profile update even if image upload fails
        }
      }

      console.log('Updating user profile with data:', payload);
      
      // Get the current auth token
      const authToken = getToken();
      if (!authToken) {
        console.warn('No auth token found when trying to update user profile');
      } else {
        console.log('Auth token found, proceeding with user update');
      }
      
      // Update the user profile through the API
      try {
        // Log the current user ID to ensure we're updating the correct record
        console.log('Updating user profile for user ID:', userId);
        
        // When using the UserContext updateUser, we need to specify the userId 
        // to make sure we update the correct user
        try {
          // This ensures we're updating the current user being registered
          if (typeof updateUser === 'function') {
            await updateUser({...payload, id: userId});
            console.log('Successfully updated user via UserContext for ID:', userId);
          } else {
            throw new Error('UserContext updateUser method not available');
          }
        } catch (contextErr) {
          console.error('Context updateUser failed, trying direct API call:', contextErr);
          
          // Make a direct PUT request with explicit auth and CSRF headers
          const csrfToken = getCsrfToken();
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-XSRF-TOKEN': csrfToken || '',
            'X-Requested-With': 'XMLHttpRequest' // This is important for Laravel to recognize the request as AJAX
          };
          
          console.log('Sending update with headers for user ID:', userId);
          
          // Use the explicit user ID from URL or localStorage, never rely on context
          const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload),
            credentials: 'include'
          });
          
          if (!response.ok) {
            // Log detailed error information
            console.error(`API error: ${response.status} ${response.statusText}`);
            
            // Try to get more details from response body
            try {
              const errorData = await response.json();
              console.error('Error response:', errorData);
            } catch (e) {
              // If we can't parse JSON, try text
              const errorText = await response.text();
              console.error('Error response text:', errorText);
            }
            
            throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
          }
          
          // Parse the successful response
          const updatedUserData = await response.json();
          console.log('Successfully updated user via direct API call');
          
          // Update the cached user data manually - ensure we store with correct user ID
          if (updatedUserData) {
            try {
              // Since we're manually updating the cache, we need to ensure
              // we update the cache for the current user being registered
              const mergedUserData = { ...updatedUserData, id: userId };
              // Save directly to localStorage with the specific user ID
              localStorage.setItem('user_data', JSON.stringify(mergedUserData));
              localStorage.setItem('user_id', userId.toString());
              console.log('Updated cached user data with correct user ID:', userId);
            } catch (cacheErr) {
              console.error('Failed to update cached user data:', cacheErr);
            }
          }
        }
      } catch (updateErr) {
        console.error('All attempts to update user profile failed:', updateErr);
        throw updateErr;
      }
      
      // Force a complete refresh of user data in all caches to ensure consistency
      try {
        // Get the current token and CSRF token to ensure they're passed to the next step
        const token = getToken();
        const csrfToken = getCsrfToken();
        
        // Store the user ID we're updating before clearing cache
        const currentUserId = userId;
        
        // 1. First completely clear the user_data from localStorage to ensure a fresh start
        localStorage.removeItem('user_data');
        console.log('Cleared user_data from localStorage to ensure fresh data');
        
        // 2. Make a fresh fetch from the API to get the latest user data, using the explicit user ID
        try {
          console.log(`Fetching fresh user data for ID ${currentUserId} after profile update`);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken || '',
            'X-Requested-With': 'XMLHttpRequest'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          // Fetch the specific user by ID instead of using /me
          const response = await fetch(`/api/users/${currentUserId}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (response.ok) {
            const freshUserData = await response.json();
            console.log('Successfully fetched fresh user data for ID:', currentUserId);
            
            // Store the fresh data in localStorage and ensure the ID is set properly
            if (freshUserData) {
              // Make sure we're storing the properly structured data
              // API might return data wrapped in a data property
              const dataToStore = freshUserData.data || freshUserData;
              
              // Ensure the correct user ID is stored
              const userData = { ...dataToStore, id: currentUserId };
              
              // Update localStorage with the fresh data
              localStorage.setItem('user_data', JSON.stringify(userData));
              localStorage.setItem('user_id', currentUserId.toString());
              console.log('Updated localStorage with fresh user data for ID:', currentUserId);
            }
          } else {
            console.error('Failed to fetch fresh user data, response:', response.status);
            
            // If we can't fetch the specific user, make sure we at least store the ID
            localStorage.setItem('user_id', currentUserId.toString());
          }
        } catch (fetchErr) {
          console.error('Error fetching fresh user data:', fetchErr);
          
          // Even if fetch fails, make sure we preserve the user ID
          localStorage.setItem('user_id', currentUserId.toString());
        }
        
        // Ensure the token is still set correctly after all operations
        if (token) {
          setToken(token);
        }
      } catch (cacheErr) {
        console.error('Failed to refresh user data:', cacheErr);
      }
      
      // Redirect to the next step of registration
      const registerType = type as string || 'user';
      // Ensure token and userId are passed in query params if available
      const token = getToken();
      const currentUserId = userId; // Capture the current user ID

      // Add additional query param if we have styles selected (for artists)
      const styleParams = selectedStyles.length > 0 
        ? `&styles=${encodeURIComponent(JSON.stringify(selectedStyles))}` 
        : '';
      
      console.log(`Redirecting to step-3 with userId=${currentUserId}`);
      
      if (token) {
        router.push(`/register/step-3?type=${registerType}&token=${encodeURIComponent(token)}&userId=${currentUserId}${styleParams}`);
      } else {
        router.push(`/register/step-3?type=${registerType}&userId=${currentUserId}${styleParams}`);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHeader = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Artist Profile';
      case 'studio':
        return 'Studio Profile';
      default:
        return 'User Profile';
    }
  };

  const getDescription = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Tell us more about yourself as an artist';
      case 'studio':
        return 'Tell us more about your studio';
      default:
        return 'Tell us more about yourself';
    }
  };

  // Handle style modal open
  const openStylesModal = () => {
    setStyleModalOpen(true);
  };
  
  // Handle style selection
  const handleApplyStyles = (updatedStyles: number[]) => {
    setSelectedStyles(updatedStyles);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-pearl p-6 rounded-lg shadow-md text-black">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Register
        </h1>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              1
            </div>
            <div className="w-8 h-1 bg-indigo-600"></div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              2
            </div>
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
              3
            </div>
          </div>
        </div>

        <h2 className="text-xl font-medium text-center text-gray-700 mb-2">
          {getHeader()}
        </h2>
        
        <p className="text-center text-gray-500 mb-6">
          {getDescription()}
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            
            <div className="flex items-center">
              <div className="w-24 h-24 border border-gray-300 rounded-full overflow-hidden bg-gray-100 mr-4">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="profileImage" 
                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Choose file
                </label>
                <input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  {...register('profileImage')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Bio/Description */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              {type === 'studio' ? 'Studio Description' : 'Bio'}
            </label>
            <textarea
              id="bio"
              rows={4}
              className={`mt-1 block w-full px-3 py-2 border text-black ${
                errors.bio ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder={type === 'studio' ? 'Tell clients about your studio...' : 'Tell us about yourself...'}
              {...register('bio', { 
                required: 'This field is required',
                maxLength: {
                  value: 500,
                  message: 'Bio cannot exceed 500 characters'
                }
              })}
            ></textarea>
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>
          
          {/* Artist Styles Selection (Only for artist registration) */}
          {type === 'artist' && (
            <div className="pt-2 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tattoo Styles</h3>
              <p className="text-sm text-gray-500 mb-3">
                Select the tattoo styles you specialize in
              </p>
              
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={openStylesModal}
                  className="w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Select Tattoo Styles
                </button>
                
                {selectedStyles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Selected styles ({selectedStyles.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedStyles.map(styleId => (
                        <span key={styleId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {styles.find(s => s.id === styleId)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Social Media Section */}
          <div className="pt-2">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Social Media Links</h3>
            
            {/* Website */}
            <div className="mb-3">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Personal Website
              </label>
              <input
                id="website"
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                placeholder="https://yourwebsite.com"
                {...register('website')}
              />
            </div>
            
            {/* Instagram */}
            <div className="mb-3">
              <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                Instagram
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  @
                </span>
                <input
                  id="instagram"
                  type="text"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  placeholder="username"
                  {...register('instagram')}
                />
              </div>
            </div>
            
            {/* Facebook */}
            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                Facebook
              </label>
              <input
                id="facebook"
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                placeholder="https://facebook.com/yourpage"
                {...register('facebook')}
              />
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Link 
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Next'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Style Selection Modal */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />
    </Layout>
  );
};

export default RegisterStepTwo;