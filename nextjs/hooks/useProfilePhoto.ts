import { useState, useEffect } from 'react';
import { api, getCsrfToken, fetchCsrfToken } from '../utils/api';
import { getToken } from '../utils/auth';

interface ProfilePhoto {
  webviewPath?: string;
  filepath?: string;
}

export const useProfilePhoto = () => {
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile photo from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPhoto = localStorage.getItem('profile_photo');
        if (storedPhoto) {
          setProfilePhoto(JSON.parse(storedPhoto));
        }
      } catch (err) {
        console.error('Error loading profile photo from storage', err);
      }
    }
  }, []);

  // Save profile photo to local storage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && profilePhoto) {
      try {
        localStorage.setItem('profile_photo', JSON.stringify(profilePhoto));
      } catch (err) {
        console.error('Error saving profile photo to storage', err);
      }
    }
  }, [profilePhoto]);

  const takeProfilePhoto = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a web environment, we'll use the file input instead of a camera
      // This is just a placeholder for the actual implementation
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Create a promise that resolves when the file is selected
      const fileSelected = new Promise<File | null>((resolve) => {
        input.onchange = (event) => {
          const files = (event.target as HTMLInputElement).files;
          resolve(files ? files[0] : null);
        };
        
        // Handle cancel
        input.oncancel = () => resolve(null);
      });
      
      // Trigger the file picker
      input.click();
      
      // Wait for file selection
      const file = await fileSelected;
      if (!file) {
        setLoading(false);
        return;
      }
      
      // Create a URL for the selected image
      const webviewPath = URL.createObjectURL(file);
      
      // Store locally first for immediate UI update
      setProfilePhoto({
        webviewPath,
        filepath: file.name,
      });
      
      // Upload the file to the server
      try {
        // First, ensure we have a CSRF token
        await fetchCsrfToken();
        
        const formData = new FormData();
        formData.append('profile_photo', file);
        
        console.log('Uploading profile photo to server...');
        
        // Get auth token
        const authToken = getToken('profile-photo-upload');
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        console.log('CSRF Token for profile photo upload:', csrfToken ? 'present' : 'missing');
        
        // Prepare headers
        const headers: HeadersInit = {};
        
        // Add Authorization header if auth token exists
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Add CSRF token if exists
        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken;
        }
        
        // We can't use our regular api.post here as it expects JSON
        // FormData needs different content-type header
        const response = await fetch('/api/users/profile-photo', {
          method: 'POST',
          body: formData,
          headers,
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error('Failed to upload profile photo:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
          throw new Error('Failed to upload profile photo to server');
        }
        
        console.log('Profile photo uploaded successfully');
        
        // You might want to update with the server-returned URL if it transforms the image
        const responseData = await response.json().catch(() => ({}));
        if (responseData && responseData.photo_url) {
          setProfilePhoto({
            webviewPath: responseData.photo_url,
            filepath: file.name,
          });
        }
      } catch (uploadErr) {
        console.error('Error uploading profile photo to server:', uploadErr);
        // We don't set an error here since the local update succeeded
        // The user still sees their photo even if server upload failed
      }
      
    } catch (err) {
      console.error('Error taking profile photo', err);
      setError('Failed to take profile photo');
    } finally {
      setLoading(false);
    }
  };

  const deleteProfilePhoto = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear local state immediately for UI responsiveness
      setProfilePhoto(null);
      
      // Remove from local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('profile_photo');
      }
      
      // Delete the photo from the server
      try {
        // First, ensure we have a CSRF token
        await fetchCsrfToken();
        
        console.log('Deleting profile photo from server...');
        
        // Get auth token
        const authToken = getToken('profile-photo-delete');
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        console.log('CSRF Token for profile photo deletion:', csrfToken ? 'present' : 'missing');
        
        // Prepare headers
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Add Authorization header if auth token exists
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Add CSRF token if exists
        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken;
        }
        
        const response = await fetch('/api/users/profile-photo', {
          method: 'DELETE',
          headers,
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error('Failed to delete profile photo from server:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
          throw new Error('Failed to delete profile photo from server');
        }
        
        console.log('Profile photo deleted successfully from server');
      } catch (deleteErr) {
        console.error('Error deleting profile photo from server:', deleteErr);
        // We don't set an error here since the local update succeeded
        // The user experience isn't affected even if server delete failed
      }
    } catch (err) {
      console.error('Error deleting profile photo', err);
      setError('Failed to delete profile photo');
    } finally {
      setLoading(false);
    }
  };

  return {
    profilePhoto,
    loading,
    error,
    takeProfilePhoto,
    deleteProfilePhoto,
  };
};