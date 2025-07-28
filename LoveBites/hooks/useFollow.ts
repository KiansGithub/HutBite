import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

interface UseFollowProps {
    targetUserId: string; 
}

export const useFollow = ({ targetUserId }: UseFollowProps) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const { user } = useAuthStore();

    const checkFollowStatus = useCallback(async () => {
        if (!user?.id || !targetUserId || user.id === targetUserId) return; 

        try {
            const { data, error } = await supabase 
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('followee_id', targetUserId)
                .limit(1);
            if (error) throw error; 
            setIsFollowing(data.length > 0)
        } catch (err) {
            console.error('Error checking follow status:', err);
        }
    }, [user?.id, targetUserId]);

    const fetchCounts = useCallback(async () => {
        if (!targetUserId) return; 

        try {
            const [followersResult, followingResult] = await Promise.all([
                supabase
                  .from('follows')
                  .select('id', { count: 'exact'})
                  .eq('followee_id', targetUserId),
                supabase 
                  .from('follows')
                  .select('id', { count: 'exact'})
                  .eq('follower_id', targetUserId), 
            ]);

            setFollowersCount(followersResult.count || 0);
            setFollowingCount(followingResult.count || 0);
        } catch (err) {
            console.error('Error fetching follow counts:', err);
        }
    }, [targetUserId]);

    const toggleFollow = useCallback(async () => {
        if (!user?.id || !targetUserId || user.id === targetUserId) return; 

        setLoading(true);

        try {
            if (isFollowing) {
                const { error } = await supabase 
                  .from('follows')
                  .delete()
                  .eq('follower_id', user.id)
                  .eq('followee_id', targetUserId);
            
            if (error) throw error; 
            setIsFollowing(false);
            setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                const followId = typeof uuid.v4() === 'string' ? uuid.v4() : String(uuid.v4());

                const { error } = await supabase 
                  .from('follows')
                  .insert({
                    id: followId, 
                    follower_id: user.id, 
                    followee_id: targetUserId, 
                  });
                
                if (error) throw error; 
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, targetUserId, isFollowing]);

    useEffect(() => {
        checkFollowStatus();
        fetchCounts();
    }, [checkFollowStatus, fetchCounts]);

    return {
        isFollowing, 
        loading, 
        followersCount, 
        followingCount, 
        toggleFollow, 
        canFollow: !!user?.id && !!targetUserId && user.id !== targetUserId,
    };
};