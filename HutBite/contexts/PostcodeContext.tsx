import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PostcodeContextType {
  postcode: string | null;
  isOnboardingComplete: boolean;
  loading: boolean;
  setPostcode: (postcode: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const PostcodeContext = createContext<PostcodeContextType | undefined>(undefined);

const POSTCODE_STORAGE_KEY = '@hutbite_postcode';
const ONBOARDING_STORAGE_KEY = '@hutbite_onboarding_complete';

interface PostcodeProviderProps {
  children: ReactNode;
}

export const PostcodeProvider: React.FC<PostcodeProviderProps> = ({ children }) => {
  const [postcode, setPostcodeState] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load stored postcode and onboarding status on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedPostcode, onboardingStatus] = await Promise.all([
          AsyncStorage.getItem(POSTCODE_STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
        ]);

        if (storedPostcode) {
          setPostcodeState(storedPostcode);
        }

        if (onboardingStatus === 'true') {
          setIsOnboardingComplete(true);
        }
      } catch (error) {
        console.error('Error loading postcode data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredData();
  }, []);

  const setPostcode = async (newPostcode: string) => {
    try {
      const normalizedPostcode = newPostcode.toUpperCase().trim();
      await AsyncStorage.setItem(POSTCODE_STORAGE_KEY, normalizedPostcode);
      setPostcodeState(normalizedPostcode);
      console.log('Postcode saved:', normalizedPostcode);
    } catch (error) {
      console.error('Error saving postcode:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingComplete(true);
      console.log('Onboarding completed');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(POSTCODE_STORAGE_KEY),
        AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY)
      ]);
      setPostcodeState(null);
      setIsOnboardingComplete(false);
      console.log('Onboarding reset');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  };

  const value: PostcodeContextType = {
    postcode,
    isOnboardingComplete,
    loading,
    setPostcode,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <PostcodeContext.Provider value={value}>
      {children}
    </PostcodeContext.Provider>
  );
};

export const usePostcode = (): PostcodeContextType => {
  const context = useContext(PostcodeContext);
  if (context === undefined) {
    throw new Error('usePostcode must be used within a PostcodeProvider');
  }
  return context;
};
