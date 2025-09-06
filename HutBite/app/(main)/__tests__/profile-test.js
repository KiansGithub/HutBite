import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../profile';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
      SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
      SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
      useSafeAreaInsets: jest.fn().mockReturnValue(inset),
      SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    };
  });
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(),
}));

jest.mock('@/hooks/useFollow', () => ({
  useFollow: jest.fn(),
}));

jest.mock('@/hooks/useSafety', () => ({
  useSafety: jest.fn(),
}));

jest.mock('@/components/RequireAuth', () => ({
    RequireAuth: ({ children }) => <>{children}</>,
}));

describe('ProfileScreen', () => {
    const mockSignOut = jest.fn();
    const mockDeleteAccount = jest.fn().mockResolvedValue({});
    const mockRouterReplace = require('expo-router').router.replace;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      // Setup default mocks for all tests
      require('@/hooks/useUserProfile').useUserProfile.mockReturnValue({
        profile: {
          display_name: 'Test User',
          bio: 'This is a test bio.',
          created_at: new Date().toISOString(),
        },
        loading: false,
      });
  
      require('@/hooks/useFollow').useFollow.mockReturnValue({
        followersCount: 10,
        followingCount: 5,
      });
  
      require('@/store/authStore').useAuthStore.mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        signOut: mockSignOut,
        deleteAccount: mockDeleteAccount,
      });
  
      require('@/hooks/useSafety').useSafety.mockReturnValue({
          reportContent: jest.fn(),
          blockUser: jest.fn(),
      });
    });
  
    it('renders profile information correctly', () => {
      const { getByText } = render(<ProfileScreen />);
  
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('This is a test bio.')).toBeTruthy();
      expect(getByText('10')).toBeTruthy(); 
      expect(getByText('Followers')).toBeTruthy();
      expect(getByText('5')).toBeTruthy(); 
      expect(getByText('Following')).toBeTruthy();
    });
  
    it('handles sign out correctly', async () => {
      const { getByText } = render(<ProfileScreen />);
      
      fireEvent.press(getByText('Sign Out'));
  
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockRouterReplace).toHaveBeenCalledWith('/auth/sign-in');
      });
    });
});