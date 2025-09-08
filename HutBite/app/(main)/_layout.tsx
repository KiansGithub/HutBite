import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TabThemeProvider, useTabTheme } from '@/contexts/TabThemeContext';
import { BlurView } from 'expo-blur';

function TabLayout() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const { theme } = useTabTheme();

    const isDark = theme === 'dark';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarBackground: () => (
                    !isDark ? (
                        <BlurView
                            intensity={90}
                            tint="light"
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null
                ),
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
                tabBarActiveTintColor: isDark ? Colors[colorScheme ?? 'light'].tint : '#000',
                tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                },
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Upload',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="map-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
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

export default function MainLayout() {
    return (
        <TabThemeProvider>
            <TabLayout />
        </TabThemeProvider>
    );
}