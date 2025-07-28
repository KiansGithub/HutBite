import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

export const useSafety = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    const blockUser = useCallback(async (targetUserId: string) => {
        if (!user?.id || !targetUserId) return { error: 'Invalid parameters'};

        setLoading(true);

        try {
            const blockId = typeof uuid.v4() === 'string' ? uuid.v4() : String(uuid.v4());

            const { error } = await supabase 
              .from('blocks')
              .insert({
                id: blockId,  
                blocker_id: user.id,
                blocked_id: targetUserId,  
              });

            if (error) throw error; 

            // Also remove any existing follows 
            await supabase 
              .from('follows')
              .delete()

.or(`and(follower_id.eq.${user.id},followee_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},followee_id.eq.${user.id})`);

        return { error: null };
        } catch (err: any) {
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const unblockUser = useCallback(async (targetUserId: string) => {
        if (!user?.id || !targetUserId) return { error: 'Invalid parameters' };
        
        setLoading(true);

        try {
            const { error } = await supabase 
              .from('blocks')
              .delete()
              .eq('blocked_id', user.id)
              .eq('blocked_id', targetUserId);
        
        if (error) throw error; 

        return { error: null };
        } catch (err: any) {
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const reportContent = useCallback(async (
        targetType: 'user' | 'item' | 'like',
        targetId: string, 
        reason: string 
    ) => {
        if (!user?.id) return { error: 'Not authenticated'};

        setLoading(true);

        try {
            const reportId = typeof uuid.v4() === 'string' ? uuid.v4() : String(uuid.v4());

            const { error } = await supabase  
              .from('reports')
              .insert({
                id: reportId, 
                reporter_id: user.id, 
                target_type: targetType, 
                target_id: targetId, 
                reason, 
                status: 'pending',
              });

            if (error) throw error; 

            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    return {
        loading, 
        blockUser, 
        unblockUser, 
        reportContent 
    };
};
