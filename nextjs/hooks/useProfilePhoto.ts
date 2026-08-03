import { useState, useEffect } from 'react';
import { imageService } from '../services/imageService';

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
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

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
        return;
      }

      // Create a URL for the selected image and open the cropper
      const imageUrl = URL.createObjectURL(file);
      setCropperImage(imageUrl);
      setIsCropperOpen(true);
    } catch (err) {
      console.error('Error selecting profile photo', err);
      setError('Failed to select profile photo');
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setLoading(true);
    setError(null);

    // Clean up the cropper image URL
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
    }

    try {
      // Create a file from the cropped blob
      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });

      // Create preview URL
      const webviewPath = URL.createObjectURL(croppedBlob);
      setProfilePhoto({
        webviewPath,
        filepath: croppedFile.name,
      });

      // Upload and associate with user profile
      const uploadedImage = await imageService.uploadProfilePhoto(croppedFile);

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
      setProfilePhoto(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('profile_photo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
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
    // Cropper state and handlers
    cropperImage,
    isCropperOpen,
    handleCropComplete,
    handleCropCancel,
  };
};
