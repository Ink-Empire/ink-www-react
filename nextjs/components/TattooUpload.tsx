import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { fetchCsrfToken, getCsrfToken } from '../utils/api';
import { getToken } from '../utils/auth';
import { useRouter } from 'next/router';

interface TattooUploadProps {
  onClose: () => void;
}

const TattooUpload: React.FC<TattooUploadProps> = ({ onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Clear preview URLs when component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Add new files to the existing files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Images must be smaller than 5MB');
        return;
      }
      
      newFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setUploadError(null); // Clear any previous errors
  };

  // Remove file
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    
    const updatedPreviewUrls = [...previewUrls];
    updatedPreviewUrls.splice(index, 1);
    
    setSelectedFiles(updatedFiles);
    setPreviewUrls(updatedPreviewUrls);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one image');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Fetch CSRF token first
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();
      const authToken = getToken();

      // Create form data for the API
      const formData = new FormData();
      
      // Log what we're uploading
      console.log(`Preparing to upload ${selectedFiles.length} files`);
      selectedFiles.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      });
      
      // Add files to the "files" array as specified
      selectedFiles.forEach((file) => {
        formData.append('files', file); // Send as 'files' for proper array handling on server
      });

      // Add user ID if available
      if (user?.id) {
        formData.append('user_id', user.id.toString());
      }

      // Prepare headers
      const headers: HeadersInit = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }

      // Submit to API endpoint
      console.log('Submitting to API with auth token:', authToken ? 'present' : 'missing');
      
      const response = await fetch('/api/tattoos/create', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });
      
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.message || 'Failed to upload images');
      }

      const responseData = await response.json();
      console.log('Initial tattoo created successfully:', responseData);
      
      // Close the modal
      onClose();
      
      // Extract tattoo ID from response
      // Adjust this based on the actual structure of your API response
      const tattooId = responseData.id || 
                     (responseData.data && responseData.data.id) || 
                     (responseData.tattoo && responseData.tattoo.id);
      
      console.log('Extracted tattoo ID for redirect:', tattooId);
      
      if (!tattooId) {
        console.error('Full response data:', responseData);
        throw new Error('Could not find tattoo ID in response. See console for details.');
      }
      
      // Save tattoo ID to session storage for retrieval after potential login
      sessionStorage.setItem('pendingTattooUpdate', tattooId.toString());
      
      // Redirect with a slight delay to ensure modal is closed
      setTimeout(() => {
        console.log(`Redirecting to: /tattoos/update?id=${tattooId}`);
        // Use Next.js router for better handling of authentication state
        router.push(`/tattoos/update?id=${tattooId}`);
      }, 300);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Upload Tattoo Images
      </Typography>

      {uploadError && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', color: 'error.dark', borderRadius: 1 }}>
          {uploadError}
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        {/* Image upload section */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Images to Upload
          </Typography>
          
          <Button
            variant="contained"
            component="label"
            sx={{ mb: 2 }}
          >
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          
          <Typography variant="body2" sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
            Supported formats: JPG, PNG, GIF, WebP (Max 5MB per image)
          </Typography>
          
          {/* Preview images */}
          {previewUrls.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1, mt: 2 }}>
              {previewUrls.map((url, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    position: 'relative',
                    aspectRatio: '1/1',
                    overflow: 'hidden',
                    borderRadius: 1
                  }}
                >
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`} 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover' 
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      padding: '2px 4px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {selectedFiles[index].name}
                  </Typography>
                  <Button
                    onClick={() => removeFile(index)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      minWidth: 'auto',
                      width: 20,
                      height: 20,
                      p: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                  >
                    ✕
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isUploading || selectedFiles.length === 0}
            sx={{ bgcolor: '#339989', '&:hover': { bgcolor: '#2d7e75' } }}
          >
            {isUploading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : 'Continue'}
          </Button>
        </Box>
      </form>
      
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        After uploading your images, you'll be redirected to add details about your tattoo work.
      </Typography>
    </Box>
  );
};

export default TattooUpload;