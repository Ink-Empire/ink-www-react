import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import UserTypeSelection from './UserTypeSelection';
import ExperienceLevel from './ExperienceLevel';
import StylesSelection from './StylesSelection';
import UserDetails from './UserDetails';
import AccountSetup from './AccountSetup';
import StudioOwnerCheck from './StudioOwnerCheck';
import StudioDetails from './StudioDetails';
import { colors } from '@/styles/colors';

export interface OnboardingData {
  userType?: 'client' | 'artist' | 'studio';
  experienceLevel?: 'beginner' | 'experienced';
  selectedStyles: number[]; // For clients: interests, For artists: specialties
  preferredStyles?: number[]; // For artists only: additional styles they enjoy working in
  userDetails?: {
    name: string;
    username: string;
    bio: string;
    profileImage?: File | null;
    location: string;
    locationLatLong: string;
  };
  credentials?: {
    email: string;
    password: string;
    password_confirmation: string;
  };
  // Studio-specific details (separate from owner's userDetails)
  studioDetails?: {
    name: string;
    username: string;
    bio: string;
    profileImage?: File | null;
    location: string;
    locationLatLong: string;
    email?: string; // Optional contact email for the studio
    phone?: string; // Optional phone number for the studio
  };
  // Studio owner info - populated when userType is 'studio'
  studioOwner?: {
    hasExistingAccount: boolean;
    existingAccountEmail?: string;
    existingAccountId?: number;
    ownerType: 'artist' | 'user'; // Is the owner also a tattoo artist?
    isAuthenticated?: boolean; // Is the owner already logged in?
    // Artist-specific fields (when ownerType === 'artist')
    artistStyles?: number[]; // Owner's personal specialty styles
  };
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
  initialUserType?: 'client' | 'artist' | 'studio' | null;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  onComplete, 
  onCancel,
  initialUserType 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentStep, setCurrentStep] = useState(initialUserType ? 1 : 0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    selectedStyles: [],
    userType: initialUserType || undefined,
  });

  const getSteps = () => {
    // If we have initial user type from registration, skip the user type step
    let steps = initialUserType ? [] : ['User Type'];

    // Add experience level step for clients only
    if (onboardingData.userType === 'client') {
      steps = [...steps, 'Experience', 'Interests', 'Profile', 'Account'];
    } else if (onboardingData.userType === 'artist') {
      steps = [...steps, 'Specialties', 'Profile', 'Account'];
    } else if (onboardingData.userType === 'studio') {
      // Studios: Owner check -> (Artist styles if owner is artist) -> Your Profile -> Account -> Studio Profile
      // Note: Studio styles are derived from artists who work there, not set during signup
      const isOwnerArtist = onboardingData.studioOwner?.ownerType === 'artist';
      const isAuthenticated = onboardingData.studioOwner?.isAuthenticated;

      if (isAuthenticated) {
        // Already authenticated: Owner -> Studio Profile (skip personal profile/account steps)
        steps = [...steps, 'Owner', 'Studio Profile'];
      } else if (isOwnerArtist) {
        // Artist owner: Owner -> Your Styles -> Your Profile -> Account -> Studio Profile
        steps = [...steps, 'Owner', 'Your Styles', 'Your Profile', 'Account', 'Studio Profile'];
      } else {
        // Non-artist owner: Owner -> Your Profile -> Account -> Studio Profile
        steps = [...steps, 'Owner', 'Your Profile', 'Account', 'Studio Profile'];
      }
    } else {
      // Default/undefined
      steps = [...steps, 'Specialties', 'Profile', 'Account'];
    }

    return steps;
  };

  const steps = getSteps();
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleUserTypeComplete = (userType: 'client' | 'artist' | 'studio') => {
    setOnboardingData(prev => ({ ...prev, userType }));
    setCurrentStep(currentStep + 1);
  };

  const handleExperienceLevelComplete = (experienceLevel: 'beginner' | 'experienced') => {
    setOnboardingData(prev => ({ ...prev, experienceLevel }));
    setCurrentStep(currentStep + 1);
  };

  const handleStudioOwnerComplete = (ownerData: {
    hasExistingAccount: boolean;
    existingAccountEmail?: string;
    existingAccountId?: number;
    ownerType: 'artist' | 'user';
  }) => {
    setOnboardingData(prev => ({ ...prev, studioOwner: ownerData }));
    setCurrentStep(currentStep + 1);
  };

  const handleStylesComplete = (selectedStyles: number[]) => {
    setOnboardingData(prev => ({ ...prev, selectedStyles }));

    // Simply advance to next step
    setCurrentStep(currentStep + 1);
  };

  // Studio owner artist-specific handlers
  const handleOwnerArtistStylesComplete = (artistStyles: number[]) => {
    setOnboardingData(prev => ({
      ...prev,
      studioOwner: {
        ...prev.studioOwner!,
        artistStyles,
      },
    }));
    setCurrentStep(currentStep + 1);
  };

  const handleOwnerArtistPreferencesComplete = (artistPreferences: number[]) => {
    setOnboardingData(prev => ({
      ...prev,
      studioOwner: {
        ...prev.studioOwner!,
        artistPreferences,
      },
    }));
    setCurrentStep(currentStep + 1);
  };

  const handleUserDetailsComplete = (userDetails: OnboardingData['userDetails']) => {
    setOnboardingData(prev => ({ ...prev, userDetails }));
    setCurrentStep(currentStep + 1);
  };

  const handleStudioDetailsComplete = (studioDetails: OnboardingData['studioDetails']) => {
    // Studio details is the final step - call onComplete with all data
    const completeData = {
      ...onboardingData,
      studioDetails,
    };
    onComplete(completeData);
  };

  // For studio flow: save credentials and advance to studio details step
  const handleStudioAccountSetupComplete = (credentials: OnboardingData['credentials']) => {
    setOnboardingData(prev => ({ ...prev, credentials }));
    setCurrentStep(currentStep + 1);
  };

  const handleAccountSetupComplete = (credentials: OnboardingData['credentials']) => {
    const completeData = {
      ...onboardingData,
      credentials,
    };

    onComplete(completeData);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      
      // Clear data for steps we're going back from to allow re-selection
      if (currentStep === 1 && !initialUserType) {
        // Going back to user type selection - clear user type
        setOnboardingData(prev => ({ ...prev, userType: undefined, experienceLevel: undefined }));
      } else if (currentStep === 2 && onboardingData.userType === 'client') {
        // Going back to experience level for clients - clear experience level
        setOnboardingData(prev => ({ ...prev, experienceLevel: undefined }));
      } else if ((currentStep === 1 && onboardingData.userType !== 'client') || 
                 (currentStep === 3 && onboardingData.userType === 'client')) {
        // Going back to styles selection - keep styles but allow re-selection
        // No need to clear styles as user should be able to modify their selection
      }
    } else if (onCancel) {
      // If we're at step 0 and there's a cancel handler, call it
      onCancel();
    }
  };

  const getCurrentStepComponent = () => {
    const isClient = onboardingData.userType === 'client';
    const isArtist = onboardingData.userType === 'artist';
    const isStudio = onboardingData.userType === 'studio';
    const hasInitialUserType = !!initialUserType;

    // Calculate effective step based on whether we have initial user type
    const effectiveStep = hasInitialUserType ? currentStep + 1 : currentStep;

    // Step 0: User Type Selection (only if no initial user type)
    if (effectiveStep === 0) {
      return (
        <UserTypeSelection
          onStepComplete={handleUserTypeComplete}
          onCancel={onCancel}
        />
      );
    }

    // From here, step 1+ depends on user type
    // Client flow: Experience -> Interests -> Profile -> Account
    // Artist flow: Specialties -> Preferences -> Profile -> Account
    // Studio flow: Owner Check -> Specialties -> Profile -> Account

    if (isClient) {
      // Client flow
      switch (effectiveStep) {
        case 1:
          return (
            <ExperienceLevel
              onStepComplete={handleExperienceLevelComplete}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <StylesSelection
              onStepComplete={handleStylesComplete}
              onBack={handleBack}
              userType="client"
            />
          );
        case 3:
          return (
            <UserDetails
              onStepComplete={handleUserDetailsComplete}
              onBack={handleBack}
              userType="client"
            />
          );
        case 4:
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType="client"
            />
          );
      }
    } else if (isArtist) {
      // Artist flow: Specialties -> Profile -> Account
      switch (effectiveStep) {
        case 1:
          return (
            <StylesSelection
              onStepComplete={handleStylesComplete}
              onBack={handleBack}
              userType="artist"
            />
          );
        case 2:
          return (
            <UserDetails
              onStepComplete={handleUserDetailsComplete}
              onBack={handleBack}
              userType="artist"
            />
          );
        case 3:
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType="artist"
            />
          );
      }
    } else if (isStudio) {
      const isOwnerArtist = onboardingData.studioOwner?.ownerType === 'artist';
      const isAuthenticated = onboardingData.studioOwner?.isAuthenticated;

      if (isAuthenticated) {
        // Already authenticated flow: Owner -> Studio Profile (skip personal profile/account)
        switch (effectiveStep) {
          case 1:
            return (
              <StudioOwnerCheck
                onStepComplete={handleStudioOwnerComplete}
                onBack={handleBack}
              />
            );
          case 2:
            // Studio profile - final step (skip directly to this)
            return (
              <StudioDetails
                onStepComplete={handleStudioDetailsComplete}
                onBack={handleBack}
              />
            );
        }
      } else if (isOwnerArtist) {
        // Artist owner flow: Owner -> Your Styles -> Your Profile -> Account -> Studio Profile
        switch (effectiveStep) {
          case 1:
            return (
              <StudioOwnerCheck
                onStepComplete={handleStudioOwnerComplete}
                onBack={handleBack}
              />
            );
          case 2:
            // Your personal artist styles
            return (
              <StylesSelection
                onStepComplete={handleOwnerArtistStylesComplete}
                onBack={handleBack}
                userType="artist"
                title="Your Specialty Styles"
                subtitle="Select the tattoo styles you specialize in as an artist"
              />
            );
          case 3:
            // Owner's personal profile (they are an artist)
            return (
              <UserDetails
                onStepComplete={handleUserDetailsComplete}
                onBack={handleBack}
                userType="artist"
              />
            );
          case 4:
            // Account credentials - then advances to studio details
            return (
              <AccountSetup
                onStepComplete={handleStudioAccountSetupComplete}
                onBack={handleBack}
                userType="artist"
              />
            );
          case 5:
            // Studio profile - final step
            return (
              <StudioDetails
                onStepComplete={handleStudioDetailsComplete}
                onBack={handleBack}
              />
            );
        }
      } else {
        // Non-artist owner flow: Owner -> Your Profile -> Account -> Studio Profile
        switch (effectiveStep) {
          case 1:
            return (
              <StudioOwnerCheck
                onStepComplete={handleStudioOwnerComplete}
                onBack={handleBack}
              />
            );
          case 2:
            // Owner's personal profile (they are a regular user)
            return (
              <UserDetails
                onStepComplete={handleUserDetailsComplete}
                onBack={handleBack}
                userType="client"
              />
            );
          case 3:
            // Account credentials - then advances to studio details
            return (
              <AccountSetup
                onStepComplete={handleStudioAccountSetupComplete}
                onBack={handleBack}
                userType="client"
              />
            );
          case 4:
            // Studio profile - final step
            return (
              <StudioDetails
                onStepComplete={handleStudioDetailsComplete}
                onBack={handleBack}
              />
            );
        }
      }
    }

    // Fallback - shouldn't reach here
    return null;
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a0e11',
      }}
    >
      {/* Progress Bar */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            backgroundColor: 'rgba(232, 219, 197, 0.2)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: colors.accent,
            },
          }}
        />
      </Box>

      {/* Step Indicator - Desktop Only */}
      {!isMobile && (
        <Box sx={{ p: 3, pb: 0 }}>
          <Stepper 
            activeStep={currentStep} 
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': {
                color: 'text.secondary',
                '&.Mui-active': {
                  color: colors.accent,
                  fontWeight: 'bold',
                },
                '&.Mui-completed': {
                  color: colors.textSecondary,
                },
              },
              '& .MuiStepIcon-root': {
                color: 'rgba(232, 219, 197, 0.3)',
                '&.Mui-active': {
                  color: colors.accent,
                },
                '&.Mui-completed': {
                  color: colors.accent,
                },
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Mobile Step Indicator */}
      {isMobile && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: colors.accent,
              fontWeight: 'bold',
            }}
          >
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </Typography>
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            backgroundColor: colors.surface,
            color: 'white',
            borderRadius: { xs: 2, md: 3 },
            maxWidth: { xs: '95%', sm: 700, md: 900 },
            width: '100%',
            mx: 'auto',
            minHeight: 'auto', // Let content determine height
            maxHeight: 'none', // Remove height constraints
            display: 'flex',
            flexDirection: 'column',
            my: 2, // Add vertical margin
          }}
        >
          {getCurrentStepComponent()}
        </Paper>
      </Box>

      {/* Footer */}
      <Box 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          borderTop: '1px solid rgba(232, 219, 197, 0.1)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          Welcome to the InkedIn community! Let's get you set up.
        </Typography>
      </Box>
    </Box>
  );
};

export default OnboardingWizard;