import * as React from 'react';
import renderer from 'react-test-renderer';
import { RestaurantCard } from '../RestaurantCard';

// Mock data for props based on supabase.d.ts
const mockRestaurant = {
  id: 'rest_1',
  created_at: new Date().toISOString(),
  name: 'LoveBites Cafe',
  description: 'A lovely cafe for all your cravings.',
  order_links: { 'Uber Eats': 'https://uber.eats/lovebites' },
  longitude: -122.4194,
  latitude: 37.7749,
  cuisines: ['Modern', 'Cafe', 'Desserts'],
  place_id: 'ChIJtest',
  google_rating: 4.8,
  google_review_count: 250,
};

const mockMenuItems = [
  {
    id: 'menu_1',
    created_at: new Date().toISOString(),
    restaurant_id: 'rest_1',
    title: 'The Heartbeet Burger',
    description: 'A delicious beet-based burger that will steal your heart.',
    price: 15.99,
    video_url: 'https://example.com/video.mp4',
    thumb_url: 'https://example.com/thumb.jpg',
  },
];

// A mock function for props that expect a function
const mockFunc = jest.fn();

it('renders correctly', () => {
  const tree = renderer.create(
    <RestaurantCard
      restaurant={mockRestaurant}
      menuItems={mockMenuItems}
      rowMode="play"
      isVisible={true}
      onHorizontalScroll={mockFunc}
      onOrderPress={mockFunc}
      distance={2.5}
      isDescriptionExpanded={false}
      setIsDescriptionExpanded={mockFunc}
      resetTrigger={0}
      bottomOffset={80}
    />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});