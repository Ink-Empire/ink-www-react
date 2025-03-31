import React from 'react';
import { useUserData } from '@/contexts/UserContext';

const UserInfoCard: React.FC = () => {
  // Using the new useUserData hook - notice we can access user properties directly
  const user = useUserData();
  
  // If still loading, show loading state
  if (user.loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
      </div>
    );
  }
  
  // If error, show error state
  if (user.error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
        <div className="text-red-500">Error loading user data: {user.error}</div>
      </div>
    );
  }
  
  // Example of using the user data directly
  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-4">
          {user.image ? (
            <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
              <span className="text-xl font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user.name || 'User'}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      
      {user.location && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Location</h3>
          <p className="text-gray-900">{user.location}</p>
        </div>
      )}
      
      {user.styles && user.styles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Preferred Styles</h3>
          <div className="flex flex-wrap gap-2">
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
      
      {/* Example of using the update methods */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={() => user.updateUser({ name: 'Updated Name' })}
          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Update Name
        </button>
        
        <button
          onClick={user.logout}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserInfoCard;