import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { userData } = useUser();
  const router = useRouter();
  
  // State to store the avatar image URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  console.log(user?.image);
  
  // Update avatar URL when user data changes
  useEffect(() => {
    // Check for profile image sources in order of preference
    if (user?.image) {
      setAvatarUrl(user.image);
    } else if (userData?.profilePhoto?.webviewPath) {
      setAvatarUrl(userData.profilePhoto.webviewPath);
    } else {
      setAvatarUrl(null);
    }
  }, [user, userData]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                  InkedIn
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname === '/'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/artists"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname.startsWith('/artists')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Artists
                </Link>
                <Link
                  href="/tattoos"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname.startsWith('/tattoos')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Tattoos
                </Link>
                <Link
                  href="/search"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname === '/search'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Search
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 border border-gray-200 group-hover:border-indigo-400 transition-colors">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={`${user?.first_name || userData?.name || 'User'} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                            <span className="text-sm font-medium">
                              {user?.first_name?.charAt(0) || 
                               userData?.name?.charAt(0) || 
                               user?.email?.charAt(0) || 
                               userData?.email?.charAt(0) || 
                               '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span>
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : userData?.name || user?.email || userData?.email || 'Profile'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} InkedIn. All rights reserved.
              </p>
            </div>
            <div className="mt-4 flex justify-center md:mt-0">
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 mr-4">
                About
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 mr-4">
                Contact
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;