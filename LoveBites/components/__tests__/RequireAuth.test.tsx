import React, { ReactNode } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { RequireAuth } from '../RequireAuth';
import { useAuthGate } from '@/hooks/useAuthGate';

jest.mock('@/hooks/useAuthGate');

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => <View {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('../RequireAuth', () => {
    const originalModule = jest.requireActual('../RequireAuth');
    return {
      __esModule: true,
      ...originalModule,
    };
  });

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return {
      LinearGradient: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    };
  });
  jest.mock('@/components/GlassPanel', () => {
    const { View } = require('react-native');
    return {
      GlassPanel: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    };
  });

describe('RequireAuth', () => {
  it('renders child components when user is authenticated', () => {
    // Arrange
    (useAuthGate as jest.Mock).mockReturnValue({
      isAuthed: true,
      ensureAuthed: jest.fn(),
    });

    // Act
    const { getByText } = render(
      <RequireAuth>
        <Text>Protected Content</Text>
      </RequireAuth>
    );

    // Assert
    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('renders login prompt when user is not authenticated', () => {
    // Arrange
    (useAuthGate as jest.Mock).mockReturnValue({
      isAuthed: false,
      ensureAuthed: jest.fn(),
    });

    // Act
    const { getByText, queryByText } = render(
      <RequireAuth>
        <Text>Protected Content</Text>
      </RequireAuth>
    );

    // Assert
    expect(getByText('Sign in Required')).toBeTruthy();
    expect(queryByText('Protected Content')).toBeNull();
  });

  it('calls ensureAuthed when sign-in button is pressed', () => {
    // Arrange
    const mockEnsureAuthed = jest.fn();
    (useAuthGate as jest.Mock).mockReturnValue({
      isAuthed: false,
      ensureAuthed: mockEnsureAuthed,
    });

    // Act
    const { getByText } = render(
      <RequireAuth>
        <Text>Protected Content</Text>
      </RequireAuth>
    );

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    // Assert
    expect(mockEnsureAuthed).toHaveBeenCalledTimes(1);
  });
});