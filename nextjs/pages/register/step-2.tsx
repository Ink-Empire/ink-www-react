import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/Layout';
import Link from 'next/link';

type FormValues = {
  bio: string;
  website: string;
  instagram: string;
  twitter: string;
  facebook: string;
  profileImage: FileList;
};

const RegisterStepTwo: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();
  
  // Watch for file input changes to create preview
  const watchProfileImage = watch("profileImage");
  
  useEffect(() => {
    if (watchProfileImage && watchProfileImage.length > 0) {
      const file = watchProfileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [watchProfileImage]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the payload
      const payload: any = {
        bio: data.bio,
        social_media: {
          website: data.website || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
        },
      };

      // Add profile image if provided
      if (data.profileImage && data.profileImage.length > 0) {
        // In a real app, you'd upload the image to a server
        payload.has_profile_image = true;
      }

      // In a real app, you'd call your API here
      console.log('Step 2 payload:', payload);
      
      // Redirect to the next step of registration
      const registerType = type as string || 'user';
      router.push(`/register/step-3?type=${registerType}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHeader = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Artist Profile';
      case 'studio':
        return 'Studio Profile';
      default:
        return 'User Profile';
    }
  };

  const getDescription = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Tell us more about yourself as an artist';
      case 'studio':
        return 'Tell us more about your studio';
      default:
        return 'Tell us more about yourself';
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Register
        </h1>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              1
            </div>
            <div className="w-8 h-1 bg-indigo-600"></div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              2
            </div>
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
              3
            </div>
          </div>
        </div>

        <h2 className="text-xl font-medium text-center text-gray-700 mb-2">
          {getHeader()}
        </h2>
        
        <p className="text-center text-gray-500 mb-6">
          {getDescription()}
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            
            <div className="flex items-center">
              <div className="w-24 h-24 border border-gray-300 rounded-full overflow-hidden bg-gray-100 mr-4">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="profileImage" 
                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Choose file
                </label>
                <input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  {...register('profileImage')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Bio/Description */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              {type === 'studio' ? 'Studio Description' : 'Bio'}
            </label>
            <textarea
              id="bio"
              rows={4}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.bio ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder={type === 'studio' ? 'Tell clients about your studio...' : 'Tell us about yourself...'}
              {...register('bio', { 
                required: 'This field is required',
                maxLength: {
                  value: 500,
                  message: 'Bio cannot exceed 500 characters'
                }
              })}
            ></textarea>
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>
          
          {/* Social Media Section */}
          <div className="pt-2">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Social Media Links</h3>
            
            {/* Website */}
            <div className="mb-3">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Personal Website
              </label>
              <input
                id="website"
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://yourwebsite.com"
                {...register('website')}
              />
            </div>
            
            {/* Instagram */}
            <div className="mb-3">
              <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                Instagram
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  @
                </span>
                <input
                  id="instagram"
                  type="text"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="username"
                  {...register('instagram')}
                />
              </div>
            </div>
            
            {/* Facebook */}
            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                Facebook
              </label>
              <input
                id="facebook"
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://facebook.com/yourpage"
                {...register('facebook')}
              />
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Link 
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterStepTwo;