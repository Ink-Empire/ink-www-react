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
import { useAuth } from '../../contexts/AuthContext';
import ProgressBar from '../../components/onboarding/ProgressBar';
import UserTypeStep from '../../components/onboarding/UserTypeStep';
import ExperienceLevelStep from '../../components/onboarding/ExperienceLevelStep';
import StylesSelectionStep from '../../components/onboarding/StylesSelectionStep';
import UserDetailsStep from '../../components/onboarding/UserDetailsStep';
import AccountSetupStep from '../../components/onboarding/AccountSetupStep';
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
  };
}

function getStepLabels(userType?: string): string[] {
  if (userType === 'client') {
    return ['Type', 'Experience', 'Interests', 'Profile', 'Account'];
  }
  if (userType === 'artist') {
    return ['Type', 'Specialties', 'Profile', 'Account'];
  }
  return ['Type', 'Details', 'Account'];
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
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

  const handleSubmit = async (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
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
      });

      navigation.navigate('VerifyEmail', { email: credentials.email });
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
          return <AccountSetupStep onComplete={handleSubmit} onBack={handleBack} />;
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
          return <AccountSetupStep onComplete={handleSubmit} onBack={handleBack} />;
      }
    }

    // Fallback for studio (simplified for now)
    switch (step) {
      case 1:
        return (
          <UserDetailsStep
            onComplete={(details) => {
              setData(prev => ({ ...prev, userDetails: details }));
              setStep(2);
            }}
            onBack={handleBack}
            userType="client"
          />
        );
      case 2:
        return <AccountSetupStep onComplete={handleSubmit} onBack={handleBack} />;
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

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.footerAccent}>Sign in</Text>
        </Text>
      </TouchableOpacity>
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
