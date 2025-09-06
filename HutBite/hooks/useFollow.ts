import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

interface UseFollowProps {
  /** ID of the profile you’re looking at */
  targetUserId?: string;
}

/**
 * Follow / unfollow logic + live counters.
 * Works for:
 *  • any profile you view (pass its user_id as targetUserId)
 *  • your own profile (pass your user.id)
 *
 * The hook auto‑refreshes when anyone follows / unfollows the target user,
 * so all components that use it stay consistent.
 */
export const useFollow = ({ targetUserId }: UseFollowProps) => {
  const { user } = useAuthStore();

  /* --- Local state ------------------------------------------------------- */
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /* We’ll reuse the same realtime subscription instance */
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* --- Helpers ----------------------------------------------------------- */
  const fetchCounts = useCallback(async () => {
    if (!targetUserId) return;

    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', targetUserId),

      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId),
    ]);

    setFollowersCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  }, [targetUserId]);

  const checkFollowStatus = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setIsFollowing(false);
      return;
    }
  
    const { count, error } = await supabase
      .from('follows')
      .select('*', { head: true, count: 'exact' }) // <- ask only for count
      .eq('follower_id', user.id)
      .eq('followee_id', targetUserId);
  
    if (error) {
      console.error('Error checking follow status', error);
      return;
    }
    setIsFollowing((count ?? 0) > 0);
  }, [user?.id, targetUserId]);

  /* --- Follow / unfollow -------------------------------------------------- */
  const toggleFollow = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) return;
  
    setLoading(true);
  
    try {
      if (isFollowing) {
        // 🔻 UNFOLLOW
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followee_id', targetUserId);
  
        if (error && error.code !== '23503') throw error; // ignore “no row”
        setIsFollowing(false);
      } else {
        // 🔺 FOLLOW
        const followId = uuid.v4() as string;
  
        const { error } = await supabase.from('follows').insert({
          id: followId,
          follower_id: user.id,
          followee_id: targetUserId,
        });
  
        if (error && error.code !== '23505') throw error; // ignore duplicate
        setIsFollowing(true);
      }
  
      await fetchCounts();          // always refresh both numbers
    } catch (err) {
      console.error('Error toggling follow', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, targetUserId, isFollowing, fetchCounts]);

  /* --- Initial fetch ------------------------------------------------------ */
  useEffect(() => {
    checkFollowStatus();
    fetchCounts();
  }, [checkFollowStatus, fetchCounts]);

  /* --- Realtime updates --------------------------------------------------- */
  useEffect(() => {
    if (!targetUserId) return;

    // Tear down any previous channel
    channelRef.current?.unsubscribe();

    channelRef.current = supabase
      .channel(`follows:target=${targetUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        payload => {
            const newRow = payload.new as any; 
            const oldRow = payload.old as any;
          // Only react if it involves our target user
          if (
            newRow?.followee_id === targetUserId ||
            newRow?.follower_id === targetUserId ||
            oldRow?.followee_id === targetUserId ||
            oldRow?.follower_id === targetUserId
          ) {
            fetchCounts();
            checkFollowStatus();
          }
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [targetUserId, fetchCounts, checkFollowStatus]);

  /* --- Global follow changes subscription for current user ------------------- */
  useEffect(() => {
    if (!user?.id) return;
 
    // Subscribe to any follow changes involving the current user
    const globalChannel = supabase
      .channel(`user-follows:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        payload => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
 
          // If current user is involved in any follow change, refresh everything
          if (
            newRow?.follower_id === user.id ||
            newRow?.followee_id === user.id ||
            oldRow?.follower_id === user.id ||
            oldRow?.followee_id === user.id
          ) {
            // Small delay to ensure DB consistency
            setTimeout(() => {
              fetchCounts();
              checkFollowStatus();
            }, 100);
          }
        }
      )
      .subscribe();
 
    return () => {
      globalChannel.unsubscribe();
    };
  }, [user?.id, fetchCounts, checkFollowStatus]);

  return {
    /* state */
    isFollowing,
    followersCount,
    followingCount,
    loading,
    /* actions */
    toggleFollow,
    canFollow: !!user?.id && !!targetUserId && user.id !== targetUserId,
  };
};
