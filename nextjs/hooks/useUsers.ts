import {useState} from 'react';
import {api} from '../utils/api';
import {getToken} from '../utils/auth';

// Define the User interface based on your API
export interface User {
    favorites: any[];
    id: number;
    name: string;
    email: string;
    username?: string;
    slug?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    location?: string;
    bio?: string;
    profile_photo?: string;
    styles?: number[];
    created_at?: string;
    updated_at?: string;
}

export const useUsers = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Get all users
    const getUsers = async (): Promise<User[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<User[]>('/users');
            setUsers(response);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Get a specific user by ID
    const getUser = async (id: number): Promise<User> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<User>(`/users/${id}`);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to fetch user with ID ${id}`;
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Get the current logged-in user using the auth token
    const getOneUser = async (): Promise<User> => {
        setLoading(true);
        setError(null);

        try {
            // Check if we have a token before making the request
            const token = getToken();
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Send request to /users/me endpoint with authentication
            // All API calls are prepended with /api
            const response = await api.get<{ data: User }>('/users/me', {
                requiresAuth: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Raw API response from /users/me:', response);

            // Unwrap the user data from the nested 'data' object
            const userData = response.data || response;

            console.log('Unwrapped user data:', userData);

            setCurrentUser(userData);
            return userData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current user';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Create a new user
    const createUser = async (userData: Partial<User>): Promise<User> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post<User>('/users', userData);
            setUsers([...users, response]);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Update a user
    const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.put<User>(`/users/${id}`, userData);

            // Update the users array with the updated user
            setUsers(users.map(user => user.id === id ? response : user));

            // Also update currentUser if it's the same user
            if (currentUser && currentUser.id === id) {
                setCurrentUser(response);
            }

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to update user with ID ${id}`;
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    //add a favorite to user
    const addFavorite = async (userId: number, type: string, id: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.post(`/users/favorites/${type}`, {
                ids: id,
            });

            // Optionally update the currentUser's favorites if needed
            if (currentUser && currentUser.id === userId) {
                setCurrentUser({
                    ...currentUser,
                    favorites: [...(currentUser.favorites || []), id]
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to add favorite for user with ID ${userId}`;
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Delete a user
    const deleteUser = async (id: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(user => user.id !== id));

            // Clear currentUser if it's the deleted user
            if (currentUser && currentUser.id === id) {
                setCurrentUser(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to delete user with ID ${id}`;
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        users,
        currentUser,
        getUsers,
        getUser,
        getOneUser,
        createUser,
        updateUser,
        deleteUser,
        addFavorite,
    };
};