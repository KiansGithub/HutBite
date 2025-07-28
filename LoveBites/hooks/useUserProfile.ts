import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

interface UserProfile {
    id: string; 
    user_id: string; 
    handle: string | null; 
    display_name: string | null; 
    avatar_url: string | null; 
    bio: string | null; 
    is_private: boolean; 
    created_at: string; 
    updated_at: string; 
}

interface UseUserProfileProps {
    userId?: string; 
}

export const useUserProfile = ({ userId }: UseUserProfileProps = {}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthStore();

    const targetUserId = userId || user?.id;

    const fetchProfile = useCallback(async () => {
        if (!targetUserId) return; 

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase 
              .from('user_profiles')
              .select('*')
              .eq('user_id', targetUserId)
              .single();
            
            if (error && error.code !== 'PGRST116') {
                throw error; 
            }

            setProfile(data || null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching user profile:', err);
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    const createProfile = useCallback(async (profileData: {
        handle?: string; 
        display_name?: string; 
        avatar_url?: string; 
        bio?: string; 
        is_private?: boolean; 
    }) => {
        if (!user?.id) return { error: 'No authenticated user' };

        setLoading(true);
        setError(null);

        try {
            const profileId = typeof uuid.v4() === 'string' ? uuid.v4() : String(uuid.v4());

            const { data, error } = await supabase 
              .from('user_profiles')
              .insert({
                id: profileId, 
                user_id: user.id, 
                handle: profileData.handle || null, 
                display_name: profileData.display_name || null, 
                avatar_url: profileData.avatar_url || null, 
                bio: profileData.bio || null, 
                is_private: profileData.is_private || false, 
              })
              .select()
              .single();
            
            if (error) throw error; 

            setProfile(data);
            return { data, error: null };
        } catch (err: any) {
            setError(err.message);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!profile) return { error: 'No profile to update'};

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase 
              .from('user_profiles')
              .update({
                ...updates, 
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id)
              .select()
              .single();

            if (error) throw error; 

            setProfile(data);
            return { data, error: null};
        } catch (err: any) {
            setError(err.message);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile, 
        loading, 
        error, 
        createProfile, 
        updateProfile, 
        refetch: fetchProfile, 
    };
};