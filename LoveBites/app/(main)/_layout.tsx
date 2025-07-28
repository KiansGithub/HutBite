import { Stack } from 'expo-router';

export default function MainLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="feed"/>
            <Stack.Screen name="profile"/>
            <Stack.Screen name="activity"/>
            <Stack.Screen name="restaurant/[id]"/>
        </Stack>
    );
}