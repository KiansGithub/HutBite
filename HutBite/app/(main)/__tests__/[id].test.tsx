import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RestaurantScreen from '../restaurant/[id]';

// Mocks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'rest_1' })),
  router: { back: jest.fn() },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock('@/lib/clickTracking', () => ({
  ClickTrackingService: {
    trackOrderLinkClick: jest.fn(),
  },
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({}),
  WebBrowserPresentationStyle: { PAGE_SHEET: 'PAGE_SHEET' },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

// Supabase chainable mock
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
const mockFrom = jest.fn(() => ({ select: mockSelect, eq: mockEq, single: mockSingle }));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn((...args: any[]) => mockFrom(...args)) },
}));

describe('RestaurantScreen [id]', () => {
  const baseRestaurant = {
    id: 'rest_1',
    name: 'Test Restaurant',
    description: 'Tasty bites and more',
    image_url: 'https://example.com/image.jpg',
    order_links: { 'Uber Eats': 'https://ubereats.example.com/rest_1' },
    phone: '+1234567890',
    address: '123 Tasty St, Food City',
    latitude: 37.7749,
    longitude: -122.4194,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant details and order links; pressing a link opens the browser and tracks click', async () => {
    // Arrange: Supabase returns a restaurant with one order link
    mockSingle.mockResolvedValueOnce({ data: baseRestaurant, error: null });

    const { getByText } = render(<RestaurantScreen />);

    // Wait for content
    await waitFor(() => {
      expect(getByText('Get delivery from')).toBeTruthy();
      expect(getByText('Test Restaurant')).toBeTruthy();
    });

    // Link tile should be present
    const linkLabel = getByText('Uber Eats');
    fireEvent.press(linkLabel);

    // Assert side effects
    const WebBrowser = require('expo-web-browser');
    const { ClickTrackingService } = require('@/lib/clickTracking');

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      'https://ubereats.example.com/rest_1',
      expect.objectContaining({
        dismissButtonStyle: 'close',
      })
    );
    expect(ClickTrackingService.trackOrderLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ restaurant_id: 'rest_1', platform: 'Uber Eats' })
    );
  });

  it('renders empty state when there are no ordering links', async () => {
    const noLinksRestaurant = { ...baseRestaurant, order_links: {} };
    mockSingle.mockResolvedValueOnce({ data: noLinksRestaurant, error: null });

    const { getByText, queryByText } = render(<RestaurantScreen />);

    await waitFor(() => {
      expect(getByText('Get delivery from')).toBeTruthy();
    });

    expect(getByText('No ordering links yet')).toBeTruthy();
    expect(getByText('You can still call or get directions.')).toBeTruthy();

    // Ensure no link tiles are rendered
    expect(queryByText('Uber Eats')).toBeNull();
  });
});