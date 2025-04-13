import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import AccountModal from '../components/AccountModal';
import StyleModal from '../components/StyleModal';
import {UserProvider, useUser} from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks';
import { useStyles } from '@/contexts/StyleContext';
import { useProfilePhoto } from '@/hooks';
import { fetchCsrfToken } from '@/utils/api';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { userData, updateUser, updateStyles, logout } = useUser();
  const { fetchCurrentUser } = useAuth();
  const { getOneUser } = useUsers();
  const { styles, getStyleName } = useStyles();
  const { profilePhoto, takeProfilePhoto, deleteProfilePhoto } = useProfilePhoto();


  // Load current user data when the component mounts
  useEffect(() => {
    // IIFE to allow async operations
    (async () => {
      try {
        // Check token status immediately
        const token = localStorage.getItem('auth_token');
        console.log('Profile page loaded - token status:', token ? 'present' : 'missing');
        
        if (!token) {
          console.warn('No auth token found, user may need to log in again');
          // Redirect to login since we can't proceed without a token
          router.push('/login');
          return;
        }
        
        // Fetch CSRF token as early as possible
        try {
          console.log('Fetching CSRF token on profile page load');
          await fetchCsrfToken();
          console.log('CSRF token fetch completed');
        } catch (err) {
          console.error('Failed to fetch CSRF token:', err);
        }
        
        // First get the user ID from localStorage
        const userId = localStorage.getItem('user_id');
        console.log('User ID from localStorage:', userId);
        
        // Clear existing userData from localStorage to ensure we get fresh data
        localStorage.removeItem('user_data');
        console.log('Cleared existing user data cache on profile page load');
        
        // Try multiple approaches to fetch user data
        let userData = null;
        
        // 1. First try: Use the fetchCurrentUser from AuthContext (uses /users/me)
        try {
          console.log('Attempting to fetch user via AuthContext...');
          const authUser = await fetchCurrentUser();
          if (authUser) {
            console.log('Successfully fetched user from AuthContext');
            userData = authUser;
          }
        } catch (authErr) {
          console.error('Error fetching from AuthContext:', authErr);
        }
        
        // 2. Second try: Use the user hooks approach (if first try failed)
        if (!userData) {
          try {
            console.log('Attempting to fetch user via hooks...');
            const hookUser = await getOneUser();
            if (hookUser) {
              console.log('Successfully fetched user via hooks');
              userData = hookUser;
            }
          } catch (hookErr) {
            console.error('Error fetching via hooks:', hookErr);
          }
        }
        
        // 3. Third try: Direct API call with user ID if available (most reliable if we have userId)
        if (userId && (!userData || !userData.id)) {
          try {
            console.log(`Attempting direct API call with user ID: ${userId}`);
            const response = await api.get(`/users/${userId}`, { 
              requiresAuth: true,
              useCache: false // Force fresh data
            });
            
            if (response) {
              console.log('Successfully fetched user via direct API call');
              // Extract user data (might be nested in data property)
              const directUserData = response.data || response;
              userData = directUserData;
            }
          } catch (directErr) {
            console.error('Error with direct API call:', directErr);
          }
        }
        
        // If we have user data from any of the approaches, store it in localStorage
        if (userData) {
          // Ensure the user ID is set correctly
          if (userId && !userData.id) {
            userData.id = Number(userId);
          }
          
          // Store the data in localStorage for UserContext to pick up
          console.log('Storing user data in localStorage:', userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          // Also store the user ID separately for easier access
          if (userData.id) {
            localStorage.setItem('user_id', userData.id.toString());
          }
        } else {
          console.error('Failed to fetch user data through all available methods');
          // If we still couldn't get user data, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error in profile page initialization:', error);
        router.push('/login');
      }
    })();
  }, []);
  
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>(userData.styles || []);

  console.log('User Data:', userData);

  // Handle account modal confirm
  const handleAccountConfirm = async (data: any) => {
    try {
      await updateUser(data);
      setToastMessage('Profile updated successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Profile update failed');
      setShowToast(true);
    } finally {
      setAccountModalOpen(false);
    }
  };

  // Handle account modal close
  const handleAccountModalClose = () => {
    setAccountModalOpen(false);
  };

  // Change username
  const changeUsername = () => {
    setFieldName('name');
    setAccountModalOpen(true);
  };

  // Change email
  const changeEmail = () => {
    setFieldName('email');
    setAccountModalOpen(true);
  };

  // Change password
  const changePassword = () => {
    setFieldName('password');
    setAccountModalOpen(true);
  };

  // Logout
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Open styles modal
  const openStylesModal = () => {
    setStyleModalOpen(true);
  };

  // Apply selected styles
  const handleApplyStyles = async (updatedStyles: number[]) => {
    setSelectedStyles(updatedStyles);
    
    try {
      await updateStyles(updatedStyles);
      setToastMessage('Styles updated successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Styles update failed');
      setShowToast(true);
    }
  };

  // Remove style
  const removeStyle = (styleId: number) => {
    const updatedStyles = selectedStyles.filter(id => id !== styleId);
    setSelectedStyles(updatedStyles);
    
    updateStyles(updatedStyles)
      .then(() => {
        setToastMessage('Style removed successfully');
        setShowToast(true);
      })
      .catch(() => {
        setToastMessage('Failed to remove style');
        setShowToast(true);
      });
  };

  console.log(userData.image)

  const styleString = userData?.type === 'artist' ? 'My Preferred Styles' : 'My Followed Styles' ?? 'My Styles';

  // Auto-hide toast after 2 seconds
  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-pearl shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h1 className="text-2xl font-medium leading-6 text-gray-900">Settings</h1>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-persian-green text-sm font-medium rounded-md text-persian-green bg-white hover:bg-pearl"
            >
              Back
            </button>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-black">{userData.name || 'User'}</h2>
              
              <div className="relative mt-4 inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                  {userData.image ? (
                    <img 
                      src={userData.image?.uri}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : profilePhoto?.webviewPath ? (
                    <img 
                      src={profilePhoto.webviewPath} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Remove button positioned as an X in the top right */}
                  {(userData.image || profilePhoto?.webviewPath) && (
                    <button 
                      onClick={deleteProfilePhoto}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white bg-opacity-85 rounded-full shadow-sm hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors border border-gray-200"
                      aria-label="Remove profile photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -bottom-6">
                  <button 
                    onClick={takeProfilePhoto}
                    className="px-3 py-1 bg-white rounded-full border border-persian-green text-sm shadow-sm hover:bg-pearl text-persian-green"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
              
              {/* My Public Page link (for artists only) */}
              {userData.type === 'artist' && userData.id && (
                <div className="mt-5">
                  <Link 
                    href={`/artists/${userData.slug || userData.id}`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-persian-green border border-persian-green rounded-md hover:bg-pearl"
                  >
                    <svg 
                      className="w-4 h-4 mr-2" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    My Public Page
                  </Link>
                </div>
              )}
            </div>
            
            <div className="mt-6 divide-y divide-gray-200">
              {/* Account settings list */}
              <ul className="divide-y divide-gray-200">
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-pearl hover:bg-opacity-75 px-4" onClick={changeUsername}>
                  <div className="text-sm font-medium text-gray-900">{userData?.name ?? 'Change Name'} </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-pearl hover:bg-opacity-75 px-4" onClick={changeEmail}>
                  <div className="text-sm font-medium text-gray-900">{userData?.email ?? 'Change Email'}</div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-pearl hover:bg-opacity-75 px-4" onClick={changePassword}>
                  <div className="text-sm font-medium text-gray-900">Change Password</div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 px-4">
                  <Link 
                    href="/support" 
                    className="text-sm font-medium text-gray-900 hover:text-persian-green"
                  >
                    Support
                  </Link>
                </li>
                
                <li className="py-4 px-4">
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-900 hover:text-persian-green"
                  >
                    Logout
                  </button>
                </li>
                
                {/* Style preferences */}
                <li className="py-4">
                  <div className="flex justify-between items-center px-4 cursor-pointer" onClick={openStylesModal}>
                    <div className="text-sm font-medium text-gray-900">{styleString}</div>
                    <svg 
                      className="h-5 w-5 text-gray-400" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <div className="mt-6 px-4 flex flex-wrap gap-2">
                    {userData.styles?.map(styleId => (
                      <div key={styleId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-persian-green bg-opacity-20 text-persian-green">
                        {getStyleName(styleId)}
                        <button
                          type="button"
                          className="ml-1.5 inline-flex text-persian-green hover:text-persian-green"
                          onClick={() => removeStyle(styleId)}
                        >
                          <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for changing account details */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={handleAccountModalClose}
        onConfirm={handleAccountConfirm}
        fieldName={fieldName}
      />
      
      {/* Modal for selecting styles */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />
      
      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-gray-800 text-white rounded shadow-lg">
          {toastMessage}
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;