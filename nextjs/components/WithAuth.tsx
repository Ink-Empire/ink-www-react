import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface WithAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const WithAuth: React.FC<WithAuthProps> = ({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth({
    middleware: 'auth',
    redirectIfUnauthenticated: redirectTo
  });

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// HOC version for pages that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectTo?: string } = {}
) {
  const AuthenticatedComponent = (props: P) => {
    const { user, isLoading } = useAuth({
      middleware: 'auth',
      redirectIfUnauthenticated: options.redirectTo || '/login'
    });

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>;
    }

    if (!user) {
      return null; // useAuth will handle redirect
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

export default WithAuth;