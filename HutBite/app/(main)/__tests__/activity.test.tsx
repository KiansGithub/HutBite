import React from 'react';
import { render } from '@testing-library/react-native';
import ActivityScreen from '../(tabs)/activity';

// Mocks aligned with existing tests
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, color, size }: any) => {
    // simple passthrough icon mock
    return null;
  },
}));

jest.mock('@/components/RequireAuth', () => ({
  RequireAuth: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/GlassPanel', () => ({
  GlassPanel: ({ children, ...rest }: any) => <>{children}</>,
}));

jest.mock('@/hooks/useActivityFeed', () => ({
  useActivityFeed: jest.fn(),
}));

describe('ActivityScreen', () => {
  const mockUseActivityFeed = require('@/hooks/useActivityFeed').useActivityFeed as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when there are no activities', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      loading: false,
      refreshing: false,
      hasMore: false,
      refresh: jest.fn(),
      loadMore: jest.fn(),
    });

    const { getByText } = render(<ActivityScreen />);

    expect(getByText('No Activity Yet')).toBeTruthy();
    expect(getByText('Follow friends to see their likes here')).toBeTruthy();
  });

  it('renders an activity item with correct text and time formatting', () => {
    const nowIso = new Date().toISOString();

    const activities = [
      {
        id: 'act_1',
        created_at: nowIso,
        restaurant_id: 'rest_1',
        menu_item_id: 'menu_1',
        user_profile: {
          display_name: 'Alice',
          handle: 'alice',
          avatar_url: null,
        },
        menu_item: {
          title: 'Truffle Burger',
          thumb_url: 'https://example.com/thumb.jpg',
        },
        restaurant: {
          name: 'Bite Club',
        },
      },
    ];

    mockUseActivityFeed.mockReturnValue({
      activities,
      loading: false,
      refreshing: false,
      hasMore: false,
      refresh: jest.fn(),
      loadMore: jest.fn(),
    });

    const { getByText } = render(<ActivityScreen />);

    // Text fragments inside the composed sentence
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Truffle Burger')).toBeTruthy();
    expect(getByText('Bite Club')).toBeTruthy();

    // Time formatting: with created_at = now, it should show "now"
    expect(getByText('now')).toBeTruthy();
  });
});