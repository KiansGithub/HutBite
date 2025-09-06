import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-constants', () => ({
    ...jest.requireActual('expo-constants'),
    expoConfig: {
        extra: {
            SUPABASE_URL: 'http://test-url.com',
            SUPABASE_ANON_KEY: 'test-key',
        },
    },
}));

jest.mock('expo-video', () => ({
    VideoView: 'VideoView',
    useVideoPlayer: () => ({
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seek: jest.fn(),
      getCurrentTime: jest.fn(),
      isMuted: false,
      isLoading: true,
      isPlaying: false,
      isLooping: false,
      duration: 0,
      error: null,
    }),
    clearVideoCacheAsync: jest.fn(),
  }));

  jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
      SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
      SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
      SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
      useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
      useSafeAreaFrame: jest.fn().mockImplementation(() => ({ x: 0, y: 0, width: 390, height: 844 })),
      initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
    };
  });

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = (props) => <View {...props}>{props.children}</View>;
  const MockMarker = (props) => <View {...props}>{props.children}</View>;
  const MockCallout = (props) => <View {...props}>{props.children}</View>;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: MockCallout,
  };
});