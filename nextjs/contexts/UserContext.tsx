import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Define interfaces for our user data
interface UserData {
  id?: number;
  name?: string;
  email?: string;
  styles?: number[];
  phone?: string;
  location?: string;
  profilePhoto?: {
    filepath?: string;
    webviewPath?: string;
  };
}

interface UserContextType {
  userData: UserData;
  loading: boolean;
  error: string | null;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  userData: {},
  loading: false,
  error: null,
  updateUser: async () => {},
  updateStyles: async () => {},
  logout: () => {},
});

// Helper functions
const USER_STORAGE_KEY = 'user_data';
const USER_ID_KEY = 'user_id';

const loadUserFromStorage = (): UserData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : {};
  } catch (e) {
    console.error('Error loading user data from storage', e);
    return {};
  }
};

const saveUserToStorage = (data: UserData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    if (data.id) {
      localStorage.setItem(USER_ID_KEY, data.id.toString());
    }
  } catch (e) {
    console.error('Error saving user data to storage', e);
  }
};

// Provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(loadUserFromStorage());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      // Check if we have a user ID stored
      const userId = localStorage.getItem(USER_ID_KEY);
      
      // Attempt to fetch user data directly from the /users/me endpoint first
      setLoading(true);
      
      try {
        // Use the /users/me endpoint to get the current user
        // All API calls are prepended with /api automatically
        console.log('UserContext: Fetching user data from /api/users/me');
        const response = await api.get<{data: UserData}>('/users/me', { requiresAuth: true });
        
        console.log('UserContext: Raw response from /users/me:', response);
        
        // Unwrap the user data from the nested 'data' object
        const userData = response.data || response;
        
        console.log('UserContext: Unwrapped user data:', userData);
        
        if (userData) {
          console.log('UserContext: Successfully fetched user data from /api/users/me');
          setUserData(userData);
          saveUserToStorage(userData);
          return;
        }
      } catch (err) {
        console.log('UserContext: Failed to fetch from /api/users/me, falling back to stored user ID');
        
        // If /users/me fails and we have a user ID, try the specific user endpoint
        if (userId) {
          try {
            const response = await api.get<{ user: UserData }>(`/users/${userId}`);
            if (response.user) {
              setUserData(response.user);
              saveUserToStorage(response.user);
            }
          } catch (userErr) {
            console.error('Error fetching user data', userErr);
            setError('Failed to load user data');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Update user data
  const updateUser = async (data: Partial<UserData>): Promise<void> => {
    if (!userData.id) {
      setError('User is not logged in');
      return;
    }
    
    setLoading(true);
    
    try {
      // Replace with your actual API endpoint
      const response = await api.put<{ user: UserData }>(`/users/${userData.id}`, data);
      
      if (response.user) {
        setUserData(response.user);
        saveUserToStorage(response.user);
      }
    } catch (err) {
      console.error('Error updating user', err);
      setError('Failed to update user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user styles
  const updateStyles = async (styles: number[]): Promise<void> => {
    return updateUser({ styles });
  };

  // Logout user
  const logout = (): void => {
    setUserData({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_ID_KEY);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        updateUser,
        updateStyles,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context
export const useUser = () => useContext(UserContext);