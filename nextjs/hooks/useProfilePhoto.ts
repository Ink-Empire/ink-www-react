import { useState, useEffect } from 'react';
import { uploadImageToS3 } from '../utils/s3Upload';
import { userService } from '../services/userService';

interface ProfilePhoto {
  webviewPath?: string;
  filepath?: string;
  imageId?: number;
}

interface UseProfilePhotoOptions {
  onSuccess?: () => void;
  updateUser?: (data: any) => Promise<void>;
}

export const useProfilePhoto = (options?: UseProfilePhotoOptions) => {
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
      // Create file input for selecting an image
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

      // Create a URL for the selected image for immediate preview
      const webviewPath = URL.createObjectURL(file);

      // Store locally first for immediate UI update
      setProfilePhoto({
        webviewPath,
        filepath: file.name,
      });

      // Upload the file to S3
      try {
        const uploadedImage = await uploadImageToS3(file, 'profile');

        // Update user profile with the new image ID
        console.log('Setting profile photo on user...');
        await userService.uploadProfilePhoto({ image_id: uploadedImage.id });

        // Update local state with server URL
        setProfilePhoto({
          webviewPath: uploadedImage.uri,
          filepath: uploadedImage.filename,
          imageId: uploadedImage.id,
        });

        // Update localStorage with server URL
        if (typeof window !== 'undefined') {
          localStorage.setItem('profile_photo', JSON.stringify({
            webviewPath: uploadedImage.uri,
            filepath: uploadedImage.filename,
            imageId: uploadedImage.id,
          }));
        }

        // Call onSuccess callback to refresh user data
        if (options?.onSuccess) {
          options.onSuccess();
        }
      } catch (uploadErr) {
        console.error('Error uploading profile photo:', uploadErr);
        setError('Failed to upload profile photo');
        // Revert local state on error
        setProfilePhoto(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profile_photo');
        }
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
      const previousPhoto = profilePhoto;
      setProfilePhoto(null);

      // Remove from local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('profile_photo');
      }

      // Delete the photo from the server by setting image_id to null via user update
      try {
        console.log('Deleting profile photo from server...');
        if (options?.updateUser) {
          await options.updateUser({ image_id: null });
        }
        console.log('Profile photo deleted successfully from server');

        // Call onSuccess callback to refresh user data
        if (options?.onSuccess) {
          options.onSuccess();
        }
      } catch (deleteErr) {
        console.error('Error deleting profile photo from server:', deleteErr);
        // Restore local state on error
        setProfilePhoto(previousPhoto);
        if (typeof window !== 'undefined' && previousPhoto) {
          localStorage.setItem('profile_photo', JSON.stringify(previousPhoto));
        }
        setError('Failed to delete profile photo');
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
