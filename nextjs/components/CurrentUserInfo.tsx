import React, { useEffect, useState } from 'react';
import { useUsers, User } from '../hooks/useUsers';

const CurrentUserInfo: React.FC = () => {
  const { getOneUser, loading, error } = useUsers();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await getOneUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading user information...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-center py-4">No user information available.</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <div className="mt-1 text-lg">
            {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Not set'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 text-lg">{user.email || 'Not set'}</div>
        </div>
        
        {user.username && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 text-lg">{user.username}</div>
          </div>
        )}
        
        {user.phone && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <div className="mt-1 text-lg">{user.phone}</div>
          </div>
        )}
        
        {user.location && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <div className="mt-1 text-lg">{user.location}</div>
          </div>
        )}
        
        {user.styles && user.styles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Favorite Styles</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {user.styles.map(styleId => (
                <span 
                  key={styleId} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  Style #{styleId}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {user.bio && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <div className="mt-1 text-lg">{user.bio}</div>
          </div>
        )}
        
        {user.created_at && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <div className="mt-1 text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentUserInfo;