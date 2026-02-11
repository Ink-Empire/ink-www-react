import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { api, authApi, mobileStorage } from '../../lib/api';
import type { User } from '@inkedin/shared/types';
import type { RegisterData } from '@inkedin/shared/api/client';

const USER_KEY = 'user';

async function getStoredUser(): Promise<User | null> {
  try {
    const stored = await mobileStorage.getItem(USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    console.error('Error reading stored user:', e);
  }
  return null;
}

async function saveUser(user: User | null): Promise<void> {
  try {
    if (user) {
      await mobileStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await mobileStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error('Error saving user:', e);
  }
}

async function clearAuthStorage(): Promise<void> {
  try {
    await mobileStorage.removeItem(USER_KEY);
    await mobileStorage.removeItem('auth_token');
  } catch (e) {
    console.error('Error clearing auth storage:', e);
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  toggleFavorite: (type: 'artist' | 'tattoo' | 'studio', id: number) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUserDirectly: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isEmailVerified: false,
  error: null,
  login: async () => {},
  register: async () => ({}),
  logout: async () => {},
  updateUser: async () => {},
  toggleFavorite: async () => {},
  refreshUser: async () => null,
  setUserDirectly: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasServerData, setHasServerData] = useState(false);
  const logoutRef = useRef<() => Promise<void>>();

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.getMe();
      const userData = (response as any)?.data || response;
      if (userData && userData.id) {
        setUser(userData);
        setHasServerData(true);
        await saveUser(userData);
        setError(null);
        return userData;
      }
      return null;
    } catch (err: any) {
      if (err?.status === 401) {
        setUser(null);
        await saveUser(null);
      }
      return null;
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      const storedUser = await getStoredUser();
      const token = await api.getToken();

      if (storedUser && token) {
        if (mounted) setUser(storedUser);
        const serverUser = await fetchUser();
        if (mounted && !serverUser) {
          setUser(null);
          await saveUser(null);
        }
      } else if (token) {
        await fetchUser();
      }

      if (mounted) setIsLoading(false);
    };

    validateSession();
    return () => { mounted = false; };
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    await clearAuthStorage();
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      let userData = response.user;

      if (!userData || !(userData as any).id) {
        const meResponse = await authApi.getMe();
        userData = (meResponse as any)?.data || meResponse;
      }

      if (userData && (userData as any).id) {
        setUser(userData as User);
        setHasServerData(true);
        await saveUser(userData as User);
      } else {
        throw new Error('Login succeeded but failed to get user data');
      }
    } catch (err: any) {
      setUser(null);
      await saveUser(null);

      const errorData = err.data || err;
      if (err.status === 403 && errorData?.requires_verification) {
        const verificationError = new Error(errorData.message) as any;
        verificationError.requires_verification = true;
        verificationError.email = errorData.email;
        throw verificationError;
      }

      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<any> => {
    setError(null);

    try {
      const response = await authApi.register(data);
      // Don't set user here — user must verify email first.
      // Token is stored by authApi.register() for polling on the VerifyEmail screen.
      return response;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    setUser(null);
    setHasServerData(false);
    await clearAuthStorage();
  }, []);

  // Wire onUnauthorized to logout
  logoutRef.current = logout;
  useEffect(() => {
    (api as any).__onUnauthorized = () => {
      logoutRef.current?.();
    };
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user?.id) throw new Error('User is not logged in');

    try {
      const response = await api.put<any>(`/users/${user.id}`, data, {
        requiresAuth: true,
      });
      const updatedUser = response.user || response.data || response;
      if (updatedUser) {
        const merged = { ...user, ...updatedUser };
        setUser(merged);
        await saveUser(merged);
      }
    } catch (err) {
      setError('Failed to update user');
      throw err;
    }
  }, [user]);

  const toggleFavorite = useCallback(async (
    type: 'artist' | 'tattoo' | 'studio',
    id: number,
  ) => {
    if (!user?.id) throw new Error('User is not logged in');

    const typeKey = `${type}s` as 'artists' | 'tattoos' | 'studios';
    const currentFavorites = user.favorites || {};
    const currentList = (currentFavorites as any)[typeKey] || [];
    const isAlreadyFavorite = currentList.includes(id);

    const updatedList = isAlreadyFavorite
      ? currentList.filter((itemId: number) => itemId !== id)
      : [...currentList, id];

    const updatedFavorites = { ...currentFavorites, [typeKey]: updatedList };

    try {
      await api.post(`/users/favorites/${type}`, {
        ids: id,
        action: isAlreadyFavorite ? 'remove' : 'add',
      }, { requiresAuth: true });

      const updatedUser = { ...user, favorites: updatedFavorites };
      setUser(updatedUser as User);
      await saveUser(updatedUser as User);
    } catch (err) {
      throw err;
    }
  }, [user]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    return fetchUser();
  }, [fetchUser]);

  const setUserDirectly = useCallback((userData: User) => {
    if (userData && (userData as any).id) {
      setUser(userData);
      saveUser(userData);
      setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isEmailVerified: hasServerData ? Boolean(user?.is_email_verified) : true,
        error,
        login,
        register,
        logout,
        updateUser,
        toggleFavorite,
        refreshUser,
        setUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
