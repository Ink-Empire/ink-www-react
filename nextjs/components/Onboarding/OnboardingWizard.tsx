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
import ArtistPreferencesSelection from './ArtistPreferencesSelection';
import UserDetails from './UserDetails';
import AccountSetup from './AccountSetup';
import { colors } from '@/styles/colors';

export interface OnboardingData {
  userType?: 'client' | 'artist' | 'studio';
  experienceLevel?: 'beginner' | 'experienced';
  selectedStyles: number[]; // For clients: interests, For artists/studios: specialties
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
      steps = [...steps, 'Specialties', 'Preferences', 'Profile', 'Account'];
    } else {
      // Studios
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

  const handleStylesComplete = (selectedStyles: number[]) => {
    setOnboardingData(prev => ({ ...prev, selectedStyles }));
    
    // Simply advance to next step
    setCurrentStep(currentStep + 1);
  };

  const handlePreferencesComplete = (preferredStyles: number[]) => {
    setOnboardingData(prev => ({ ...prev, preferredStyles }));
    setCurrentStep(currentStep + 1);
  };

  const handleUserDetailsComplete = (userDetails: OnboardingData['userDetails']) => {
    setOnboardingData(prev => ({ ...prev, userDetails }));
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
    const hasInitialUserType = !!initialUserType;
    
    // Adjust step indices based on whether we skip user type selection
    const adjustedStep = hasInitialUserType ? currentStep : currentStep;
    const stepOffset = hasInitialUserType ? 1 : 0;
    
    switch (adjustedStep) {
      case 0:
        // Only show user type selection if we don't have initial user type
        if (!hasInitialUserType) {
          return (
            <UserTypeSelection 
              onStepComplete={handleUserTypeComplete}
              onCancel={onCancel}
            />
          );
        }
        // If we have initial user type, fall through to next step
        
      case (0 + stepOffset):
        if (isClient) {
          return (
            <ExperienceLevel
              onStepComplete={handleExperienceLevelComplete}
              onBack={handleBack}
            />
          );
        } else {
          // For artists and studios, show specialties/interests selection
          return (
            <StylesSelection
              onStepComplete={handleStylesComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        }
        
      case (1 + stepOffset):
        if (isClient) {
          return (
            <StylesSelection
              onStepComplete={handleStylesComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        } else if (onboardingData.userType === 'artist') {
          // For artists: show preferences selection (step 2 in their flow)
          return (
            <ArtistPreferencesSelection
              onStepComplete={handlePreferencesComplete}
              onBack={handleBack}
              specialtyStyles={onboardingData.selectedStyles}
            />
          );
        } else {
          // For studios: go directly to profile (step 2 in their flow)
          return (
            <UserDetails
              onStepComplete={handleUserDetailsComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        }
        
      case (2 + stepOffset):
        if (isClient) {
          // For clients: after experience and styles → profile  
          return (
            <UserDetails
              onStepComplete={handleUserDetailsComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        } else if (onboardingData.userType === 'artist') {
          // For artists: after specialties and preferences → profile
          return (
            <UserDetails
              onStepComplete={handleUserDetailsComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        } else {
          // For studios: after specialties and profile → account
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        }

      case 3:
        // Handle case when stepOffset = 0 and we're on step 3
        if (isClient) {
          // For clients: after experience, styles, profile → account
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        } else if (onboardingData.userType === 'artist') {
          // For artists: after specialties, preferences, profile → account
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        } else {
          // Studios should not reach step 3 when stepOffset = 0 (they have 4 steps total)
          // But if they do, show account setup
          return (
            <AccountSetup
              onStepComplete={handleAccountSetupComplete}
              onBack={handleBack}
              userType={onboardingData.userType!}
            />
          );
        }

      case 4:
        // Final step when stepOffset = 0 (clients and artists): AccountSetup
        return (
          <AccountSetup
            onStepComplete={handleAccountSetupComplete}
            onBack={handleBack}
            userType={onboardingData.userType!}
          />
        );
        
      default:
        return null;
    }
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