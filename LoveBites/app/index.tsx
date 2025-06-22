import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user, initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return null;
  }

  return <Redirect href={user ? '/(main)/feed' : '/auth/sign-in'} />;
}