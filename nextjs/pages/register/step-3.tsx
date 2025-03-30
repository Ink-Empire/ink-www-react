import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';

const RegisterStepThree: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;
  
  const getTitle = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Artist Registration Complete';
      case 'studio':
        return 'Studio Registration Complete';
      default:
        return 'Registration Complete';
    }
  };

  const getMessage = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Your artist account has been created successfully. You can now start building your profile and showcasing your work.';
      case 'studio':
        return 'Your studio account has been created successfully. You can now start building your studio profile and adding artists.';
      default:
        return 'Your account has been created successfully. You can now start exploring artists and tattoos.';
    }
  };
  
  const getNextStepsText = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return 'Next steps for artists:';
      case 'studio':
        return 'Next steps for studios:';
      default:
        return 'Next steps:';
    }
  };

  const getNextSteps = () => {
    const registerType = type as string || 'user';
    
    switch (registerType) {
      case 'artist':
        return [
          'Upload your portfolio and showcase your work',
          'Set your availability for appointments',
          'Connect with tattoo studios',
          'Engage with clients and grow your audience'
        ];
      case 'studio':
        return [
          'Add artists to your studio profile',
          'Upload photos of your studio space',
          'Set your business hours and services',
          'Start accepting booking requests'
        ];
      default:
        return [
          'Explore artists and tattoos',
          'Save your favorite designs',
          'Connect with artists for consultations',
          'Share your tattoo journey'
        ];
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {getTitle()}
          </h1>
          
          <p className="mt-2 text-gray-600">
            {getMessage()}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              1
            </div>
            <div className="w-8 h-1 bg-indigo-600"></div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              2
            </div>
            <div className="w-8 h-1 bg-indigo-600"></div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              3
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {getNextStepsText()}
          </h2>
          
          <ul className="list-disc pl-5 space-y-2">
            {getNextSteps().map((step, index) => (
              <li key={index} className="text-gray-600">
                {step}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/profile"
            className="inline-flex justify-center items-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to My Profile
          </Link>
          
          <Link
            href="/"
            className="inline-flex justify-center items-center px-5 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterStepThree;