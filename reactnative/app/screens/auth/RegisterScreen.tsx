import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImagesToS3 } from '../../../lib/s3Upload';
import { leadService } from '../../../lib/leadService';
import { createUserService, createStudioService } from '@inkedin/shared/services';
import ProgressBar from '../../components/onboarding/ProgressBar';
import UserTypeStep from '../../components/onboarding/UserTypeStep';
import ExperienceLevelStep from '../../components/onboarding/ExperienceLevelStep';
import StylesSelectionStep from '../../components/onboarding/StylesSelectionStep';
import UserDetailsStep from '../../components/onboarding/UserDetailsStep';
import AccountSetupStep from '../../components/onboarding/AccountSetupStep';
import TattooIntentStep from '../../components/onboarding/TattooIntentStep';
import type { TattooIntentData } from '../../components/onboarding/TattooIntentStep';
import StudioOwnerCheckStep from '../../components/onboarding/StudioOwnerCheckStep';
import type { StudioOwnerData } from '../../components/onboarding/StudioOwnerCheckStep';
import StudioDetailsStep from '../../components/onboarding/StudioDetailsStep';
import type { StudioDetailsData } from '../../components/onboarding/StudioDetailsStep';
import type { ImageFile } from '../../../lib/s3Upload';

import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface OnboardingData {
  userType?: 'client' | 'artist' | 'studio';
  experienceLevel?: 'beginner' | 'experienced';
  selectedStyles: number[];
  userDetails?: {
    name: string;
    username: string;
    bio: string;
    location: string;
    locationLatLong: string;
    profileImage?: ImageFile;
    studioAffiliation?: {
      studioId: number;
      studioName: string;
      isNew: boolean;
      isClaimed: boolean;
    };
  };
  tattooIntent?: TattooIntentData;
  studioOwner?: StudioOwnerData;
  studioDetails?: StudioDetailsData;
}

function getStepLabels(userType?: string): string[] {
  if (userType === 'client') {
    return ['Type', 'Experience', 'Interests', 'Profile', 'Plans', 'Account'];
  }
  if (userType === 'artist') {
    return ['Type', 'Specialties', 'Profile', 'Account'];
  }
  return ['Type', 'Owner', 'Studio Details'];
}

const userService = createUserService(api);
const studioService = createStudioService(api);

export default function RegisterScreen({ navigation }: Props) {
  const { register, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({ selectedStyles: [] });

  const stepLabels = getStepLabels(data.userType);

  const handleBack = () => {
    if (step === 0) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const uploadProfilePhoto = async (image: ImageFile) => {
    try {
      const uploaded = await uploadImagesToS3(api, [image], 'profile');
      if (uploaded.length > 0) {
        await userService.uploadProfilePhoto(uploaded[0].id);
      }
    } catch (err) {
      console.error('Profile photo upload failed:', err);
    }
  };

  const handleSubmit = async (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
    has_accepted_toc: boolean;
    has_accepted_privacy_policy: boolean;
  }) => {
    if (!data.userDetails) return;

    setLoading(true);
    try {
      await register({
        name: data.userDetails.name,
        email: credentials.email,
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
        username: data.userDetails.username,
        slug: data.userDetails.username,
        about: data.userDetails.bio,
        location: data.userDetails.location,
        location_lat_long: data.userDetails.locationLatLong,
        type: data.userType || 'client',
        selected_styles: data.userType === 'artist' ? data.selectedStyles : undefined,
        preferred_styles: data.userType === 'client' ? data.selectedStyles : undefined,
        experience_level: data.experienceLevel,
        studio_id: data.userDetails.studioAffiliation?.studioId,
        has_accepted_toc: credentials.has_accepted_toc,
        has_accepted_privacy_policy: credentials.has_accepted_privacy_policy,
      });

      // Fire off photo upload and lead creation in the background
      // Don't block navigation to the verify email screen
      if (data.userDetails.profileImage) {
        uploadProfilePhoto(data.userDetails.profileImage);
      }

      if (data.userType === 'client' && data.tattooIntent && data.tattooIntent.timing) {
        leadService.create({
          timing: data.tattooIntent.timing,
          tag_ids: data.tattooIntent.tagIds,
          custom_themes: data.tattooIntent.customThemes,
          description: data.tattooIntent.description,
          allow_artist_contact: data.tattooIntent.allowArtistContact,
        }).catch(err => console.error('Lead creation failed:', err));
      }

      // Set user in AuthContext — VerifyEmailGate will show automatically
      // since is_email_verified is false
      await refreshUser();
    } catch (err: any) {
      const message = err.data?.message || err.message || 'Registration failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudioSubmit = async (studioDetails: StudioDetailsData) => {
    setLoading(true);
    try {
      if (data.studioOwner?.isAuthenticated) {
        // Existing user - create or claim studio directly
        let studioResponse: any;
        let claimError: string | null = null;
        try {
          if (studioDetails.studioResult?.id) {
            studioResponse = await studioService.claim(studioDetails.studioResult.id, {
              bio: studioDetails.bio,
              phone: studioDetails.phone,
            });
          } else {
            studioResponse = await studioService.lookupOrCreate({
              name: studioDetails.name,
              username: studioDetails.username,
              bio: studioDetails.bio,
              email: studioDetails.email,
              phone: studioDetails.phone,
              location: studioDetails.location,
              location_lat_long: studioDetails.locationLatLong,
            });
          }
        } catch (err: any) {
          claimError = err.data?.error || err.data?.message || err.message || 'Failed to create studio.';
          console.error('Studio claim/create failed:', err);
        }

        // Upload photo and associate with both studio and user profile
        const studioId = studioResponse?.studio?.id;
        if (studioDetails.studioPhoto && studioId) {
          try {
            const uploaded = await uploadImagesToS3(api, [studioDetails.studioPhoto], 'studio');
            if (uploaded.length > 0) {
              const imageId = uploaded[0].id;
              await Promise.all([
                studioService.uploadImage(studioId, imageId),
                userService.uploadProfilePhoto(imageId),
              ]);
            }
          } catch (err) {
            console.error('Studio photo upload/association failed:', err);
          }
        }

        // Always refresh so AuthContext picks up the authenticated session
        await refreshUser();

        // Show claim error after signing in (so user isn't stuck in a broken state)
        if (claimError) {
          Alert.alert('Studio Error', claimError);
          return;
        }
      } else {
        // New user - register first, studio is created in the backend
        const response = await register({
          name: studioDetails.name,
          email: studioDetails.accountEmail || studioDetails.email,
          password: studioDetails.password || '',
          password_confirmation: studioDetails.password_confirmation || '',
          username: studioDetails.username,
          slug: studioDetails.username,
          about: studioDetails.bio,
          location: studioDetails.location,
          location_lat_long: studioDetails.locationLatLong,
          type: 'studio',
          studio_email: studioDetails.email,
          studio_phone: studioDetails.phone,
          claim_studio_id: studioDetails.studioResult?.id,
          has_accepted_toc: true,
          has_accepted_privacy_policy: true,
        });

        // Upload photo to S3 and associate with both user and studio
        const studioId = response?.studio?.id;
        if (studioDetails.studioPhoto) {
          try {
            const uploaded = await uploadImagesToS3(api, [studioDetails.studioPhoto], 'studio');
            if (uploaded.length > 0) {
              const imageId = uploaded[0].id;
              const promises: Promise<any>[] = [
                userService.uploadProfilePhoto(imageId),
              ];
              if (studioId) {
                promises.push(studioService.uploadImage(studioId, imageId));
              }
              await Promise.all(promises);
            }
          } catch (err) {
            console.error('Studio photo upload/association failed:', err);
          }
        }

        // Set user in AuthContext — VerifyEmailGate will show automatically
        // and poll until email is verified, then transition to the main app
        await refreshUser();
      }
    } catch (err: any) {
      const message = err.data?.message || err.message || 'Registration failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    // Step 0 is always UserType
    if (step === 0) {
      return (
        <UserTypeStep
          onSelect={(type) => {
            setData(prev => ({ ...prev, userType: type }));
            setStep(1);
          }}
        />
      );
    }

    if (data.userType === 'client') {
      switch (step) {
        case 1:
          return (
            <ExperienceLevelStep
              onSelect={(level) => {
                setData(prev => ({ ...prev, experienceLevel: level }));
                setStep(2);
              }}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <StylesSelectionStep
              onComplete={(styles) => {
                setData(prev => ({ ...prev, selectedStyles: styles }));
                setStep(3);
              }}
              onBack={handleBack}
              userType="client"
              initialSelection={data.selectedStyles}
            />
          );
        case 3:
          return (
            <UserDetailsStep
              onComplete={(details) => {
                setData(prev => ({ ...prev, userDetails: details }));
                setStep(4);
              }}
              onBack={handleBack}
              userType="client"
            />
          );
        case 4:
          return (
            <TattooIntentStep
              onComplete={(intent) => {
                setData(prev => ({ ...prev, tattooIntent: intent }));
                setStep(5);
              }}
              onBack={handleBack}
            />
          );
        case 5:
          return (
            <AccountSetupStep
              onComplete={handleSubmit}
              onBack={handleBack}
              userType="client"
              loading={loading}
            />
          );
      }
    }

    if (data.userType === 'artist') {
      switch (step) {
        case 1:
          return (
            <StylesSelectionStep
              onComplete={(styles) => {
                setData(prev => ({ ...prev, selectedStyles: styles }));
                setStep(2);
              }}
              onBack={handleBack}
              userType="artist"
              initialSelection={data.selectedStyles}
            />
          );
        case 2:
          return (
            <UserDetailsStep
              onComplete={(details) => {
                setData(prev => ({ ...prev, userDetails: details }));
                setStep(3);
              }}
              onBack={handleBack}
              userType="artist"
            />
          );
        case 3:
          return (
            <AccountSetupStep
              onComplete={handleSubmit}
              onBack={handleBack}
              userType="artist"
              loading={loading}
            />
          );
      }
    }

    // Studio flow
    if (data.userType === 'studio') {
      switch (step) {
        case 1:
          return (
            <StudioOwnerCheckStep
              onComplete={(ownerData) => {
                setData(prev => ({ ...prev, studioOwner: ownerData }));
                setStep(2);
              }}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <StudioDetailsStep
              onComplete={handleStudioSubmit}
              onBack={handleBack}
              isAuthenticated={data.studioOwner?.isAuthenticated || false}
              loading={loading}
            />
          );
      }
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar
        currentStep={step}
        totalSteps={stepLabels.length}
        label={stepLabels[step]}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.stepContainer}>
          {renderStep()}
        </View>
      </KeyboardAvoidingView>

      {step === 0 && (
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerAccent}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
});
