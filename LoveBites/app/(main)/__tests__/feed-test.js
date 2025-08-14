import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FeedScreen from '../feed';

// Mock the custom hooks
jest.mock('@/hooks/useRestaurantData', () => ({
  useRestaurantData: jest.fn(),
}));
jest.mock('@/hooks/useLocation', () => ({
  useLocation: jest.fn(),
}));
jest.mock('@/hooks/useSearch', () => ({
  useSearch: jest.fn(),
}));
jest.mock('@/hooks/useViewabilityTracking', () => ({
  useViewabilityTracking: jest.fn(),
}));

// Mock other dependencies
jest.mock('@/lib/analytics', () => ({
  logScreenView: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: jest.fn(),
}));

describe('FeedScreen', () => {
  it('should render a list of restaurants', () => {
    // Setup mock return values for hooks
    require('@/hooks/useRestaurantData').useRestaurantData.mockReturnValue({
      restaurants: [
        { id: '1', name: 'Restaurant A', distance: 1.2 },
        { id: '2', name: 'Restaurant B', distance: 3.4 },
      ],
      menuItems: {
        '1': [{ id: 'm1', name: 'Dish 1' }],
        '2': [{ id: 'm2', name: 'Dish 2' }],
      },
      loading: false,
      reshuffleRestaurants: jest.fn(),
    });

    require('@/hooks/useLocation').useLocation.mockReturnValue({
        location: { latitude: 1, longitude: 1 },
        loading: false,
    });

    require('@/hooks/useSearch').useSearch.mockReturnValue({
        searchResults: [],
        isSearching: false,
        setSearchQuery: jest.fn(),
        setSearchType: jest.fn(),
    });

    require('@/hooks/useViewabilityTracking').useViewabilityTracking.mockReturnValue({
        vIndex: 0,
        visibleHIndex: 0,
        onViewableChange: jest.fn(),
        updateHorizontalIndex: jest.fn(),
        resetIndexes: jest.fn(),
    });

    render(<FeedScreen />);

    // Check if the restaurant names are rendered
    expect(screen.getByText('Restaurant A')).toBeTruthy();
    // Note: Restaurant B won't be visible initially due to the full-screen vertical FlatList
    // We can test for its data being in the list instead.
    const flatList = screen.getByTestId('restaurant-flatlist'); // Assuming you add a testID to the FlatList
    expect(flatList.props.data.length).toBe(2);
  });
});