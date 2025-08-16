import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MapScreen from '../map';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { router } from 'expo-router';

// Mock the custom hooks and expo-router 
jest.mock('@/hooks/useRestaurantData');
jest.mock('@/hooks/useLocation');
jest.mock('expo-router', () => ({
    router: {
      push: jest.fn(),
    },
    useRouter: () => ({ push: jest.fn() }),
  }));
  
  // Mock react-native-maps components for easier testing
  jest.mock('react-native-maps', () => {
      const React = require('react');
      const { View, Text, Pressable } = require('react-native');
  
      const MockMapView = (props: any) => <View {...props} testID="map-view">{props.children}</View>;
      const MockMarker = (props: any) => <View {...props} testID={`marker-${props.title}`}>{props.children}</View>;
      const MockCallout = (props: any) => <Pressable {...props} testID={`callout-${props.testID}`}>{props.children}</Pressable>;
  
      return {
          __esModule: true,
          default: MockMapView,
          Marker: MockMarker,
          Callout: MockCallout,
      };
  });
  
  const mockRestaurants = [
    { id: '1', name: 'Restaurant A', latitude: 37.78825, longitude: -122.4324, created_at: '', address: '', city: '', state: '', zip_code: '', phone_number: '', website: '', rating: null, price_range: null, cuisine: null, image_url: null, user_id: null },
    { id: '2', name: 'Restaurant B', latitude: 37.78826, longitude: -122.4325, created_at: '', address: '', city: '', state: '', zip_code: '', phone_number: '', website: '', rating: null, price_range: null, cuisine: null, image_url: null, user_id: null },
    // Invalid restaurant
    { id: '3', name: 'Restaurant C', latitude: null, longitude: -122.4326, created_at: '', address: '', city: '', state: '', zip_code: '', phone_number: '', website: '', rating: null, price_range: null, cuisine: null, image_url: null, user_id: null },
    // Duplicate coordinates with Restaurant A
    { id: '4', name: 'Restaurant D', latitude: 37.78825, longitude: -122.4324, created_at: '', address: '', city: '', state: '', zip_code: '', phone_number: '', website: '', rating: null, price_range: null, cuisine: null, image_url: null, user_id: null },
  ];
  
  describe('MapScreen', () => {
    const mockUseRestaurantData = useRestaurantData as jest.Mock;
    const mockUseLocation = useLocation as jest.Mock;
    const mockRouterPush = router.push as jest.Mock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseRestaurantData.mockReturnValue({ restaurants: [], loading: true });
      mockUseLocation.mockReturnValue({ location: null });
    });
  
    it('renders loading indicator while fetching data', () => {
        const { getByTestId } = render(<MapScreen />);
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });
    
      it('renders map with markers when data is loaded', () => {
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0], mockRestaurants[1]], loading: false });
        const { getByTestId } = render(<MapScreen />);
        expect(getByTestId('map-view')).toBeTruthy();
        expect(getByTestId('marker-Restaurant A')).toBeTruthy();
        expect(getByTestId('marker-Restaurant B')).toBeTruthy();
      });
    
      it('filters out restaurants with invalid coordinates', () => {
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0], mockRestaurants[2]], loading: false });
        const { getByTestId, queryByTestId } = render(<MapScreen />);
        expect(getByTestId('marker-Restaurant A')).toBeTruthy();
        expect(queryByTestId('marker-Restaurant C')).toBeNull();
      });
    
      it('handles marker press and navigates', () => {
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0]], loading: false });
        const { getByTestId } = render(<MapScreen />);
        
        const callout = getByTestId('callout-undefined'); // The testID is from the mock
        fireEvent.press(callout);
    
        expect(mockRouterPush).toHaveBeenCalledWith('/(main)/restaurant/1');
      });
    
      it('sets initial region to user location if available', () => {
        const userLocation = { latitude: 40.7128, longitude: -74.0060 };
        mockUseLocation.mockReturnValue({ location: userLocation });
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0]], loading: false });
        
        const { getByTestId } = render(<MapScreen />);
        const mapView = getByTestId('map-view');
        expect(mapView.props.initialRegion.latitude).toBe(userLocation.latitude);
        expect(mapView.props.initialRegion.longitude).toBe(userLocation.longitude);
      });
    
      it('sets initial region to first restaurant if no user location', () => {
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0]], loading: false });
        const { getByTestId } = render(<MapScreen />);
        const mapView = getByTestId('map-view');
        expect(mapView.props.initialRegion.latitude).toBe(mockRestaurants[0].latitude);
        expect(mapView.props.initialRegion.longitude).toBe(mockRestaurants[0].longitude);
      });
    
      it('offsets duplicate coordinates', () => {
        mockUseRestaurantData.mockReturnValue({ restaurants: [mockRestaurants[0], mockRestaurants[3]], loading: false });
        const { getByTestId } = render(<MapScreen />);
        const markerA = getByTestId('marker-Restaurant A');
        const markerD = getByTestId('marker-Restaurant D');
  
      // Original coordinates
      const originalLat = mockRestaurants[0].latitude!;
      const originalLng = mockRestaurants[0].longitude!;
  
      // Marker A should have original coordinates
      expect(markerA.props.coordinate.latitude).toBe(originalLat);
      expect(markerA.props.coordinate.longitude).toBe(originalLng);
  
      // Marker D should have offset coordinates
      expect(markerD.props.coordinate.latitude).not.toBe(originalLat);
      expect(markerD.props.coordinate.longitude).not.toBe(originalLng);
      expect(markerD.props.coordinate.latitude).toBeCloseTo(originalLat + 0.0001);
      expect(markerD.props.coordinate.longitude).toBeCloseTo(originalLng + 0.0001);
    });
  });