import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppGeolocation } from '@/utils/geolocation';
import { setToken } from '@/utils/auth';
import { getCsrfToken, fetchCsrfToken } from '@/utils/api';

type RegistrationType = 'user' | 'artist' | 'studio';

type FormValues = {
  name: string;
  username: string;
  slug: string;
  email: string;
  password: string;
  password_confirmation: string; // Password confirmation field
  phone?: string;
  location?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registerType, setRegisterType] = useState<RegistrationType>('user');
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [locationString, setLocationString] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>();
  
  // Generate a slug from the username (convert to kebab-case)
  const generateSlug = (username: string) => {
    // Convert PascalCase/camelCase to kebab-case by inserting hyphens before capital letters
    // Then lowercase everything and replace any non-alphanumeric characters with hyphens
    return username
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Insert hyphens before capital letters
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with hyphens
      .replace(/(^-|-$)/g, ''); // Remove leading and trailing hyphens
  };
  
  // Validate username in real-time
  const validateUsername = (value: string) => {
    if (!value) return false;
    return /^[a-zA-Z0-9._]+$/.test(value);
  };
  
  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (!username || !validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }
    
    try {
      setCheckingUsername(true);
      
      // Fetch a fresh CSRF token before making the request
      try {
        console.log('Fetching CSRF token for username check');
        await fetchCsrfToken();
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay to ensure cookie is set
      } catch (csrfErr) {
        console.error('Failed to fetch CSRF token:', csrfErr);
      }
      
      // Get the CSRF token from the cookie
      const csrfToken = getCsrfToken();
      console.log('CSRF token available:', csrfToken ? 'Yes' : 'No');
      
      const response = await fetch('/api/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || '', // Add CSRF token header
          'X-Requested-With': 'XMLHttpRequest' // Required for Laravel to identify AJAX requests
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ username }),
      });
      
      // Handle 422 status specifically (username taken)
      if (response.status === 422) {
        console.log('Username is already taken (422 response)');
        setUsernameAvailable(false);
        return false;
      }
      
      // Handle other error responses
      if (!response.ok) {
        throw new Error('Failed to check username availability');
      }
      
      const data = await response.json();
      setUsernameAvailable(data.available);
      return data.available;
    } catch (error) {
      console.error('Error checking username availability:', error);
      
      // If this was due to a 422 response, we've already handled it above
      // This catch block handles unexpected errors during the fetch
      if (error instanceof Error && error.message.includes('422')) {
        // If the error message contains 422, this means username is taken
        setUsernameAvailable(false);
        return false;
      } else {
        // For other errors, set to null (unknown status)
        setUsernameAvailable(null);
        return null;
      }
    } finally {
      setCheckingUsername(false);
    }
  };
  
  // Debounce function to prevent too many API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  
  // Debounced username check
  const debouncedUsernameCheck = React.useCallback(
    debounce(checkUsernameAvailability, 500),
    []
  );
  
  const toggleLocation = () => {
    const newValue = !useMyLocation;
    console.log(`Toggling location to: ${newValue ? 'use my location' : 'manual entry'}`);
    setUseMyLocation(newValue);
    
    // If switching to "use my location", immediately try to get the location
    if (newValue && (registerType === 'user' || registerType === 'artist')) {
      setLocationString('Detecting your location...');
      
      // Get location immediately rather than waiting for effect
      setTimeout(() => {
        const getPositionData = async () => {
          try {
            console.log('Getting position after toggling to use location');
            const position = await getCurrentPosition();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLocationLatLong(`${lat},${lng}`);
            
            // Use reverse geocoding to get address
            const locationData = await getLocation(lat, lng);
            if (locationData.items && locationData.items.length > 0) {
              const address = locationData.items[0].address;
              const locationStr = [
                address.city, 
                address.state, 
                address.countryCode
              ].filter(Boolean).join(', ');
              
              setLocationString(locationStr || 'Current Location');
              setValue('location', locationStr || 'Current Location');
            } else {
              setLocationString('Current Location');
              setValue('location', 'Current Location');
            }
          } catch (err) {
            console.error('Failed to get location after toggling', err);
            setLocationString('Location unavailable');
            // If location fails, switch back to manual entry
            setUseMyLocation(false);
          }
        };
        getPositionData();
      }, 100);
    } else {
      // If switching to manual entry, clear the location
      setLocationString('');
      setLocationLatLong('');
    }
  };

  // Initialize geolocation hook with all needed functions
  const { getCurrentPosition, getLocation, getLatLong } = useAppGeolocation();
  
  // Debug available geolocation API
  useEffect(() => {
    console.log('Geolocation API available:', typeof window !== 'undefined' && !!window.navigator?.geolocation);
    console.log('Current registration type:', registerType);
  }, [registerType]);
  
  // Fetch countries when component mounts
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // In a real app, you'd make an API call here
        // For now, we'll use some example countries
        setCountries([
          { id: 1, code: 'US', name: 'United States' },
          { id: 2, code: 'CA', name: 'Canada' },
          { id: 3, code: 'UK', name: 'United Kingdom' },
          { id: 4, code: 'AU', name: 'Australia' }
        ]);
      } catch (err) {
        console.error('Failed to fetch countries', err);
      }
    };

    fetchCountries();

    // Get user's location if using "my location" (for both regular users and artists)
    if (useMyLocation && (registerType === 'user' || registerType === 'artist')) {
      const getPositionData = async () => {
        try {
          // Show loading state
          setLocationString('Detecting your location...');
          console.log(`Attempting to get location for registration type: ${registerType}`);
          
          // Add timeout to handle potential hanging geolocation requests
          const positionPromise = getCurrentPosition();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Location request timed out')), 15000); // Extended timeout
          });
          
          // Use Promise.race to handle either success or timeout
          console.log('Waiting for geolocation response...');
          const position = await Promise.race([
            positionPromise,
            timeoutPromise
          ]) as any;
          
          console.log('Got position:', position?.coords);
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLocationLatLong(`${lat},${lng}`);
          
          // Use reverse geocoding to get address from coordinates
          const locationData = await getLocation(lat, lng);
          
          if (locationData.items && locationData.items.length > 0) {
            const address = locationData.items[0].address;
            const locationStr = [
              address.city, 
              address.state, 
              address.countryCode
            ].filter(Boolean).join(', ');
            
            setLocationString(locationStr || 'Current Location');
            setValue('location', locationStr || 'Current Location');
          } else {
            setLocationString('Current Location');
            setValue('location', 'Current Location');
          }
        } catch (err) {
          console.error('Failed to get location', err);
          console.log('Error details:', {
            code: (err as any).code,
            message: err instanceof Error ? err.message : String(err),
            type: typeof err,
            registerType
          });
          
          // Get more specific with the error message
          let errorMessage = 'Location unavailable';
          
          if (err instanceof Error) {
            if (err.message.includes('timed out')) {
              errorMessage = 'Location request timed out';
              console.log('Location timed out');
            } else if (err.message.includes('permission') || (err as any).code === 1) {
              errorMessage = 'Location permission denied';
              console.log('Location permission denied');
              // Toggle to manual entry since user denied permission
              setUseMyLocation(false);
            } else if ((err as any).code === 2) {
              errorMessage = 'Location service unavailable';
              console.log('Location service unavailable');
            } else if ((err as any).code === 3) {
              errorMessage = 'Location request timed out (code 3)';
              console.log('Location timed out (code 3)');
            }
          }
          
          setLocationString(errorMessage);
          
          // If location detection failed, allow manual entry
          if (useMyLocation) {
            setTimeout(() => {
              // Show a notification to the user
              console.log('Showing alert for manual location entry');
              alert('We couldn\'t detect your location. You can enter it manually.');
              setUseMyLocation(false);
            }, 500);
          }
        }
      };
      
      getPositionData();
    }
  }, [useMyLocation, registerType, setValue, getCurrentPosition, getLocation]);

  // We're already getting getLatLong in the hook initialization above
  
  const handleLocationInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value.length > 2) {
      try {
        // Use our geocoding hook to convert address to coordinates
        const locationData = await getLatLong(value);
        
        if (locationData?.items && locationData.items.length > 0) {
          // Use the first result
          const item = locationData.items[0];
          // Don't overwrite what the user is currently typing
          if (item.address?.label) {
            // Only update if we got a valid result and the user hasn't changed the input
            if (e.target.value === value) {
              setLocationLatLong(`${item.position.lat},${item.position.lng}`);
            }
          } else {
            // No valid label found, just keep user's input
            setLocationLatLong(''); // Clear coordinates
          }
        } else {
          // No results found, just use the input text
          setLocationLatLong(''); // Clear coordinates
        }
      } catch (err) {
        console.error('Geocoding error', err);
        // On error, just keep user's input and clear coordinates
        setLocationLatLong('');
      }
    }
  };

  const handleStudioInput = async () => {
    const city = watch('city');
    const postalCode = watch('postal_code');
    const country = watch('country');
    
    if (city && country) {
      // Create a location string with available data
      const locationQuery = [
        city,
        postalCode,
        country
      ].filter(Boolean).join(', ');
      
      // Always update the location string with what's been entered
      setLocationString(locationQuery);
      
      try {
        // Use our geocoding hook to convert address to coordinates
        const locationData = await getLatLong(locationQuery);
        
        if (locationData?.items && locationData.items.length > 0) {
          // Use the first result for coordinates
          const item = locationData.items[0];
          setLocationLatLong(`${item.position.lat},${item.position.lng}`);
        } else {
          // No results found, keep the composed string but clear coordinates
          setLocationLatLong(''); 
        }
      } catch (err) {
        console.error('Geocoding error', err);
        // On error, keep the composed string but clear coordinates
        setLocationLatLong('');
      }
    } else {
      // Clear location data if required fields are empty
      setLocationString('');
      setLocationLatLong('');
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check username availability one last time before submitting
      if (usernameAvailable !== true) {
        const isAvailable = await checkUsernameAvailability(data.username);
        if (!isAvailable) {
          setError('Username is already taken. Please choose another username.');
          setIsLoading(false);
          return;
        }
      }
      
      // Create the payload based on registration type
      const payload: any = {
        name: data.name,
        username: data.username,
        slug: data.slug,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation, // Add password confirmation
        phone: data.phone || '',
        location: locationString,
        location_lat_long: locationLatLong,
        type: registerType,
      };

      // Add address data for studio registrations
      if (registerType === 'studio') {
        payload.address = {
          address1: data.address1,
          address2: data.address2 || '',
          city: data.city,
          state: data.state || '',
          postal_code: data.postal_code || '',
          country_code: data.country
        };
      }

      // Make a direct fetch to avoid CORS issues
      console.log('Register payload:', payload);
      
      try {
        // First, get a fresh CSRF token
        console.log('Fetching CSRF token for registration');
        await fetchCsrfToken();
        
        // Wait to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Log CSRF token availability 
        const csrfTokenAvailable = getCsrfToken() ? true : false;
        console.log('CSRF token available:', csrfTokenAvailable);
        
        // Get the CSRF token from the imported function
        const csrfToken = getCsrfToken();
        console.log('Using CSRF token:', csrfToken);
        
        // Now make the registration request with the CSRF token
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken || '', // Add the CSRF token
            'X-Requested-With': 'XMLHttpRequest' // Required for Laravel to identify AJAX requests
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 419) {
            // CSRF token mismatch error
            console.error('CSRF token mismatch. Status:', response.status);
            throw new Error('CSRF protection error. Please try again.');
          }
          
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }
        
        // Handle successful response
        const data = await response.json();
        console.log('Registration response:', data);

        if (data.token) {
          // Use the imported setToken function to safely store token
          setToken(data.token);
          
          // Store user data in localStorage for step-2
          if (data.user && data.user.id) {
            console.log('Storing user data in localStorage, ID:', data.user.id);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            localStorage.setItem('user_id', data.user.id.toString());
          }
          
          // Double-check data was stored properly
          setTimeout(() => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUserId = localStorage.getItem('user_id');
            
            if (storedToken && storedUserId) {
              console.log('Auth token and user ID successfully stored in localStorage');
            } else {
              console.error('Storage check failed:', {
                token: storedToken ? 'present' : 'missing',
                userId: storedUserId ? 'present' : 'missing'
              });
            }
          }, 100);
        } else {
          console.warn('No token received in registration response:', data);
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        throw apiError;
      }
      
      // Store the user ID from the response to localStorage
      if (data && data.user && data.user.id) {
        localStorage.setItem('user_id', data.user.id.toString());
        localStorage.setItem('user_data', JSON.stringify(data.user));
        console.log('Stored user ID and data from registration response:', data.user.id);
      } else if (data && data.id) {
        localStorage.setItem('user_id', data.id.toString());
        localStorage.setItem('user_data', JSON.stringify(data));
        console.log('Stored user ID and data from registration response:', data.id);
      }
      
      // Redirect to the next step of registration with token in query string
      // and user ID to ensure it's available in the next step
      if (data && data.token) {
        const userId = (data.user && data.user.id) || data.id;
        await router.push(`/register/step-2?type=${registerType}&token=${encodeURIComponent(data.token)}&userId=${userId}`);
      } else {
        await router.push(`/register/step-2?type=${registerType}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const headerMessage = registerType === 'studio' 
    ? 'Studio Information' 
    : 'Personal Information';

  const namePlaceholder = registerType === 'studio' 
    ? 'Studio Name' 
    : 'Name';

  const emailPlaceholder = registerType === 'studio' 
    ? 'Studio Email' 
    : 'Email';

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-pearl p-6 rounded-lg shadow-md text-black">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Register
        </h1>
        
        {/* Registration Type Selector */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setRegisterType('user')}
              className={`px-4 py-2 text-sm font-medium border ${
                registerType === 'user'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-lg`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Switching to artist type from tab');
                setRegisterType('artist');
                
                // If using "my location", try to get location for artist type
                if (useMyLocation) {
                  console.log('Switching to artist with location enabled');
                  // Reset location to trigger detection
                  setLocationString('Detecting your location...');
                  
                  // Add a slight delay to ensure state updates first
                  setTimeout(() => {
                    const getPositionData = async () => {
                      try {
                        console.log('Getting position after switching to artist tab');
                        const position = await getCurrentPosition();
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        setLocationLatLong(`${lat},${lng}`);
                        
                        // Use reverse geocoding to get address
                        const locationData = await getLocation(lat, lng);
                        if (locationData.items && locationData.items.length > 0) {
                          const address = locationData.items[0].address;
                          const locationStr = [
                            address.city, 
                            address.state, 
                            address.countryCode
                          ].filter(Boolean).join(', ');
                          setLocationString(locationStr || 'Current Location');
                          setValue('location', locationStr || 'Current Location');
                        }
                      } catch (err) {
                        console.error('Failed to get location after switching to artist tab', err);
                        setLocationString('Location unavailable');
                      }
                    };
                    getPositionData();
                  }, 100);
                }
              }}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                registerType === 'artist'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Artist
            </button>
            <button
              type="button"
              onClick={() => setRegisterType('studio')}
              className={`px-4 py-2 text-sm font-medium border ${
                registerType === 'studio'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-lg`}
            >
              Studio
            </button>
          </div>
        </div>

        <h2 className="text-xl font-medium text-center text-gray-700 mb-4">
          {headerMessage}
        </h2>
        
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
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {namePlaceholder}
            </label>
            <input
              id="name"
              type="text"
              className={`mt-1 block w-full px-3 py-2 border text-black ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder={namePlaceholder}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                className={`mt-1 block w-full px-3 py-2 border text-black ${
                  errors.username ? 'border-red-300' : 
                  usernameValid === false ? 'border-red-300' :
                  usernameValid === true ? 'border-green-300' :
                  'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Username"
                {...register('username', { 
                  required: 'Username is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._]+$/,
                    message: 'Username can only contain letters, numbers, periods, and underscores'
                  },
                  onChange: (e) => {
                    const value = e.target.value;
                    // Skip validation if empty
                    if (!value) {
                      setUsernameValid(null);
                      setUsernameAvailable(null);
                      setValue('slug', '');
                      return;
                    }
                    
                    // Validate and update state
                    const isValid = validateUsername(value);
                    setUsernameValid(isValid);
                    
                    // Generate slug if valid
                    if (isValid) {
                      const slug = generateSlug(value);
                      setValue('slug', slug);
                      
                      // Check username availability
                      debouncedUsernameCheck(value);
                    }
                  },
                  onBlur: (e) => {
                    const username = e.target.value;
                    if (username && validateUsername(username)) {
                      const slug = generateSlug(username);
                      setValue('slug', slug);
                      
                      // Check username availability on blur directly (not debounced)
                      checkUsernameAvailability(username);
                    }
                  },
                  validate: async (value) => {
                    // This will be called when the form is submitted
                    if (!value) return true;
                    
                    // If we already know it's available, don't check again
                    if (usernameAvailable === true) return true;
                    
                    // Otherwise, check and return result
                    const isAvailable = await checkUsernameAvailability(value);
                    return isAvailable || 'This username is already taken';
                  }
                })}
              />
              {usernameValid === true && !checkingUsername && usernameAvailable === true && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {checkingUsername && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 pointer-events-none">
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {usernameValid === true && !checkingUsername && usernameAvailable === false && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
            {usernameValid === false && !errors.username && (
              <p className="mt-1 text-sm text-red-600">Username can only contain letters, numbers, periods, and underscores</p>
            )}
            {usernameValid === true && !checkingUsername && usernameAvailable === false && !errors.username && (
              <p className="mt-1 text-sm text-red-600">This username is already taken</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Username can only contain letters, numbers, periods, and underscores</p>
          </div>
          
          {/* Slug field (non-editable) */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Profile URL Slug
            </label>
            <input
              id="slug"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md shadow-sm sm:text-sm"
              readOnly
              {...register('slug')}
            />
            <p className="mt-1 text-xs text-gray-500">This will be used for your profile URL and cannot be changed later</p>
          </div>
          
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {emailPlaceholder}
            </label>
            <input
              id="email"
              type="email"
              className={`mt-1 block w-full px-3 py-2 border text-black ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder={emailPlaceholder}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`mt-1 block w-full px-3 py-2 border text-black ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          
          {/* Password Confirmation field */}
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              className={`mt-1 block w-full px-3 py-2 border text-black ${
                errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Confirm Password"
              {...register('password_confirmation', {
                required: 'Please confirm your password',
                validate: (value) => {
                  const password = watch('password');
                  return password === value || 'The passwords do not match';
                }
              })}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
            )}
          </div>
          
          {/* Studio-specific fields */}
          {registerType === 'studio' && (
            <>
              {/* Address fields */}
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  id="address1"
                  type="text"
                  className={`mt-1 block w-full px-3 py-2 border text-black ${
                    errors.address1 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Address"
                  {...register('address1', { required: registerType === 'studio' ? 'Address is required' : false })}
                />
                {errors.address1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                  Address 2
                </label>
                <input
                  id="address2"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Address 2 (Optional)"
                  {...register('address2')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="City"
                    {...register('city', { 
                      required: registerType === 'studio' ? 'City is required' : false,
                      onChange: () => setTimeout(() => handleStudioInput(), 100)
                    })}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    id="state"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="State/Province"
                    {...register('state', {
                      onChange: () => setTimeout(() => handleStudioInput(), 100)
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    id="postal_code"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Postal Code"
                    {...register('postal_code', {
                      onChange: () => setTimeout(() => handleStudioInput(), 100)
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <select
                    id="country"
                    className={`mt-1 block w-full px-3 py-2 border text-black ${
                      errors.country ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('country', { 
                      required: registerType === 'studio' ? 'Country is required' : false,
                      onChange: () => setTimeout(() => handleStudioInput(), 100)
                    })}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Phone"
                  {...register('phone')}
                />
              </div>
            </>
          )}
          
          {/* Location field for user/artist */}
          {registerType !== 'studio' && (
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {useMyLocation ? 'Using your current location' : 'Enter your location'}
                </span>
                <button
                  type="button"
                  onClick={toggleLocation}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {useMyLocation ? 'Enter manually' : 'Use my location'}
                </button>
              </div>
              
              {useMyLocation ? (
                <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                  <span className="flex-1">{locationString || 'Detecting your location...'}</span>
                </div>
              ) : (
                <input
                  id="location"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="City, State/Province, Country"
                  value={locationString}
                  onChange={(e) => {
                    setLocationString(e.target.value);
                    handleLocationInput(e);
                  }}
                />
              )}
            </div>
          )}
          
          {/* Artist checkbox for users */}
          {registerType === 'user' && (
            <div className="flex items-center">
              <input
                id="is-artist"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                onChange={(e) => {
                  const newType = e.target.checked ? 'artist' : 'user';
                  console.log(`Changing registration type to: ${newType}`);
                  setRegisterType(newType);
                  
                  // If switching to artist and using location, trigger location detection
                  if (e.target.checked && useMyLocation) {
                    console.log('Switching to artist type with location enabled');
                    // Reset location to trigger detection
                    setLocationString('Detecting your location...');
                    // Add a slight delay to ensure state updates first
                    setTimeout(() => {
                      const getPositionData = async () => {
                        try {
                          console.log('Getting position after switching to artist');
                          const position = await getCurrentPosition();
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setLocationLatLong(`${lat},${lng}`);
                          console.log('Got location after switching to artist');
                          
                          // Use reverse geocoding to get address
                          const locationData = await getLocation(lat, lng);
                          if (locationData.items && locationData.items.length > 0) {
                            const address = locationData.items[0].address;
                            const locationStr = [
                              address.city, 
                              address.state, 
                              address.countryCode
                            ].filter(Boolean).join(', ');
                            setLocationString(locationStr || 'Current Location');
                            setValue('location', locationStr || 'Current Location');
                          }
                        } catch (err) {
                          console.error('Failed to get location after type change', err);
                          setLocationString('Location unavailable');
                        }
                      };
                      getPositionData();
                    }, 100);
                  }
                }}
              />
              <label htmlFor="is-artist" className="ml-2 block text-sm text-gray-900">
                I am a tattoo artist
              </label>
            </div>
          )}
          
          {/* Confirmation checkbox */}
          <div className="flex items-center mt-6">
            <input
              id="confirmed"
              type="checkbox"
              className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                errors.confirmed ? 'border-red-500' : ''
              }`}
              {...register('confirmed', { 
                required: 'You must agree to the terms and conditions' 
              })}
            />
            <label htmlFor="confirmed" className="ml-2 block text-sm text-gray-900">
              I confirm that I have read and agree to the Terms and Conditions and Privacy Policy
            </label>
          </div>
          {errors.confirmed && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmed.message}</p>
          )}
          
          {/* Submit button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </>
              ) : 'Next'}
            </button>
          </div>
          
          {/* Login link */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;