import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../sign-in';

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    signIn: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ error: null }),
    signInWithProvider: jest.fn().mockResolvedValue({ error: null }),
  })),
}));

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    signIn: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ error: null }),
    signInWithProvider: jest.fn().mockResolvedValue({ error: null }),
  })),
}));

jest.mock('@/lib/analytics', () => ({
  logScreenView: jest.fn(),
}));

// Mock components that are not essential for logic testing
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));
jest.mock('@/components/GlassPanel', () => ({
  GlassPanel: ({ children }) => children,
}));
jest.mock('@/components/OAuthButtons', () => ({
  GoogleSignInButton: ({ onPress, loading }) => (
    <button onClick={onPress} disabled={loading}>
      Sign in with Google
    </button>
  ),
  AppleSignInButton: ({ onPress, loading }) => (
    <button onClick={onPress} disabled={loading}>
      Sign in with Apple
    </button>
  ),
}));

describe('SignInScreen', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders correctly and logs screen view', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText('Welcome to hutbite')).toBeTruthy();
    expect(getByText('Your culinary adventure awaits')).toBeTruthy();
    expect(require('@/lib/analytics').logScreenView).toHaveBeenCalledWith('SignIn', 'AuthScreen');
  });

  it('shows an alert if email or password are not provided', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByText } = render(<SignInScreen />);

    fireEvent.press(getByText('Sign In to hutbite'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });
});