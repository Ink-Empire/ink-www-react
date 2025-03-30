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
    // Check token status immediately
    const checkTokenStatus = () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('Profile page loaded - token status:', token ? 'present' : 'missing');
        
        if (!token) {
          console.warn('No auth token found, user may need to log in again');
          // You could redirect to login here if needed
          // router.push('/login');
        }
      } catch (error) {
        console.error('Error checking token status:', error);
      }
    };
    
    checkTokenStatus();
    
    // Fetch CSRF token as early as possible
    const fetchCsrf = async () => {
      try {
        console.log('Fetching CSRF token on profile page load');
        await fetchCsrfToken();
        console.log('CSRF token fetch completed');
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
      }
    };
    
    fetchCsrf();
    
    const loadUserData = async () => {
      try {
        // First try to fetch from AuthContext
        const authUser = await fetchCurrentUser();
        console.log(authUser);
        console.log('Fetched current user from AuthContext (/users/me)');
        
        // Then use our hook for complete data
        await getOneUser();
        console.log('Fetched current user from useUsers hook (/users/me)');
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    loadUserData();
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h1 className="text-2xl font-medium leading-6 text-gray-900">Settings</h1>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">{userData.name || 'User'}</h2>
              
              <div className="relative mt-4 inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                  {userData.image ? (
                    <img 
                      src={userData.image} 
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
                
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  <button 
                    onClick={takeProfilePhoto}
                    className="px-3 py-1 bg-white rounded-full border border-gray-300 text-sm shadow-sm hover:bg-gray-50"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 divide-y divide-gray-200">
              {/* Account settings list */}
              <ul className="divide-y divide-gray-200">
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-4" onClick={changeUsername}>
                  <div className="text-sm font-medium text-gray-900">{userData?.name ?? 'Change Name'} </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-4" onClick={changeEmail}>
                  <div className="text-sm font-medium text-gray-900">{userData?.email ?? 'Change Email'}</div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-4" onClick={changePassword}>
                  <div className="text-sm font-medium text-gray-900">Change Password</div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                
                <li className="py-4 px-4">
                  <Link 
                    href="/support" 
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    Support
                  </Link>
                </li>
                
                <li className="py-4 px-4">
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    Logout
                  </button>
                </li>
                
                {/* Style preferences */}
                <li className="py-4">
                  <div className="flex justify-between items-center px-4 cursor-pointer" onClick={openStylesModal}>
                    <div className="text-sm font-medium text-gray-900">My Followed Styles</div>
                    <svg 
                      className="h-5 w-5 text-gray-400" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <div className="mt-4 px-4 flex flex-wrap gap-2">
                    {userData.styles?.map(styleId => (
                      <div key={styleId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getStyleName(styleId)}
                        <button
                          type="button"
                          className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
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