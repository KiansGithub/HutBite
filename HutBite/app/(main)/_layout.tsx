import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function MainLayout() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60 + insets.bottom, 
                    paddingBottom: insets.bottom + 5,
                    paddingTop: 10,
                    left: 0,
                    right: 0,
                    bottom: 0,
                },
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.8)',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Upload',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="map" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="restaurant/[id]"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}