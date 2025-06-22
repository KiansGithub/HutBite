// app/auth/_layout.tsx   (AuthLayout)
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        /* 🟢 remove the default black background */
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{ contentStyle: { backgroundColor: 'transparent' } }}
      />
    </Stack>
  );
}
