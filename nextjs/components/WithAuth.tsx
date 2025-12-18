import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

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
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [isLoading, user, router, redirectTo]);

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
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Redirect if not authenticated
    React.useEffect(() => {
      if (!isLoading && !user) {
        router.push(options.redirectTo || '/login');
      }
    }, [isLoading, user, router]);

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>;
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

export default WithAuth;