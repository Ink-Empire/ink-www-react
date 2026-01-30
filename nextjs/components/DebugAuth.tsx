import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

export const DebugAuth: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing /users/me endpoint...');
        const response = await userService.getMe();
        console.log('API Response:', response);
        setApiResponse(response);
      } catch (error: any) {
        console.error('API Error:', error);
        setApiError(error.message || 'Unknown error');
      }
    };

    if (isAuthenticated) {
      testApi();
    }
  }, [isAuthenticated]);

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999
      }}>
        <h4>Auth Debug</h4>
        <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        <p><strong>API Response:</strong> {apiResponse ? JSON.stringify(apiResponse, null, 2) : 'null'}</p>
        <p><strong>API Error:</strong> {apiError || 'none'}</p>
      </div>
    );
  }

  return null;
};