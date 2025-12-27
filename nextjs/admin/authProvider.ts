import { AuthProvider } from 'react-admin';
import { api } from '@/utils/api';
import { getToken, setToken, removeToken } from '@/utils/auth';

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface MeResponse {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

const authProvider: AuthProvider = {
  login: async ({ username, password }: LoginCredentials) => {
    try {
      const response = await api.post<LoginResponse>('/login', {
        email: username,
        password,
      });

      console.log('Login response:', response);
      console.log('User object:', response.user);
      console.log('is_admin value:', response.user?.is_admin);
      console.log('is_admin type:', typeof response.user?.is_admin);

      if (response.token) {
        setToken(response.token);
      }

      // Check is_admin - handle both boolean true and truthy values
      const isAdmin = response.user?.is_admin === true || response.user?.is_admin === 1 || response.user?.is_admin === '1';

      if (!isAdmin) {
        console.log('Admin check failed, is_admin:', response.user?.is_admin);
        removeToken();
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store user info for getIdentity
      localStorage.setItem('admin_user', JSON.stringify(response.user));

      return Promise.resolve();
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  logout: async () => {
    try {
      await api.post('/logout', {});
    } catch (e) {
      // Ignore logout errors
    }

    removeToken();
    localStorage.removeItem('admin_user');
    localStorage.removeItem('user');

    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = getToken('checkAuth');

    if (!token) {
      throw new Error('No auth token');
    }

    try {
      // Verify the token is still valid and user is still admin
      const response = await api.get<{ data: MeResponse } | MeResponse>('/users/me', { useCache: false });

      // Handle both wrapped {data: user} and unwrapped user responses
      const user = (response as any).data || response;

      console.log('checkAuth response:', response);
      console.log('checkAuth user:', user);
      console.log('checkAuth is_admin:', user?.is_admin);

      // Check is_admin - handle both boolean true and truthy values
      const isAdmin = user?.is_admin === true || user?.is_admin === 1 || user?.is_admin === '1';

      if (!isAdmin) {
        throw new Error('Admin privileges required');
      }

      // Update stored user info
      localStorage.setItem('admin_user', JSON.stringify(user));

      return Promise.resolve();
    } catch (error) {
      removeToken();
      localStorage.removeItem('admin_user');
      throw error;
    }
  },

  checkError: async (error: any) => {
    const status = error?.status || error?.response?.status;

    if (status === 401 || status === 403) {
      removeToken();
      localStorage.removeItem('admin_user');
      throw new Error('Session expired');
    }

    return Promise.resolve();
  },

  getIdentity: async () => {
    try {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return {
          id: user.id,
          fullName: user.name,
          avatar: undefined,
        };
      }

      // If no stored user, fetch from API
      const user = await api.get<MeResponse>('/users/me', { useCache: false });
      localStorage.setItem('admin_user', JSON.stringify(user));

      return {
        id: user.id,
        fullName: user.name,
        avatar: undefined,
      };
    } catch (error) {
      throw new Error('Failed to get identity');
    }
  },

  getPermissions: async () => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.is_admin ? 'admin' : 'user';
    }
    return 'user';
  },
};

export default authProvider;
