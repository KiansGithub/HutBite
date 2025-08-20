import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface ActivityItem {
  id: string;
  user_id: string;
  user_profile: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  };
  restaurant_id: string;
  content_type: 'menu_item' | 'ugc_video';
  content_id: string;
  restaurant: {
    name: string;
  };
  content: {
    title: string;
    thumb_url: string | null;
  };
  created_at: string;
}

export const useActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();

  const fetchActivities = useCallback(async (offset = 0, isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // First, get the list of users we follow
      const { data: followedUsers, error: followError } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      // If we don't follow anyone, return empty results
      if (!followedUsers || followedUsers.length === 0) {
        setActivities([]);
        setHasMore(false);
        return;
      }

      const followedUserIds = followedUsers.map(f => f.followee_id);

      // Get the list of blocked users
      const { data: blockedUsers, error: blockError } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (blockError) throw blockError;

      const blockedUserIds = blockedUsers?.map(b => b.blocked_id) || [];

      // Now get the activity feed
      let query = supabase
        .from('user_likes')
        .select(`
          id,
          user_id,
          restaurant_id,
          content_type,
          content_id,
          created_at,
          user_profiles!inner(
            display_name,
            handle,
            avatar_url,
            is_private
          ),
          restaurants!inner(
            name
          )
        `)
        .in('user_id', followedUserIds)
        .not('user_profiles.is_private', 'eq', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + 19);

      // Filter out blocked users if any
      if (blockedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch content details separately based on content_type
      const formattedData: ActivityItem[] = [];

      for (const item of data) {
        let contentData = null;

        if (item.content_type === 'menu_item') {
          const { data: menuItem } = await supabase
            .from('menu_items')
            .select('title, thumb_url')
            .eq('id', item.content_id)
            .single();
          contentData = menuItem;
        } else if (item.content_type === 'ugc_video') {
          const { data: ugcVideo } = await supabase
            .from('ugc_videos')
            .select('title, thumb_url')
            .eq('id', item.content_id)
            .eq('status', 'approved')
            .single();
          contentData = ugcVideo;
        }

        if (contentData) {
          formattedData.push({
            id: item.id,
            user_id: item.user_id,
            user_profile: Array.isArray(item.user_profiles) ? item.user_profiles[0] : item.user_profiles,
            restaurant_id: item.restaurant_id,
            content_type: item.content_type,
            content_id: item.content_id,
            restaurant: Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants,
            content: {
              title: contentData.title,
              thumb_url: contentData.thumb_url,
            },
            created_at: item.created_at,
          });
        }
      }

      if (isRefresh || offset === 0) {
        setActivities(formattedData);
      } else {
        setActivities(prev => [...prev, ...formattedData]);
      }

      setHasMore(formattedData.length === 20);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const refresh = useCallback(() => {
    fetchActivities(0, true);
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(activities.length);
    }
  }, [loading, hasMore, activities.length, fetchActivities]);

  useEffect(() => {
    fetchActivities();
  // Subscribe to follow changes to refresh activity feed
  if (!user?.id) return;

  const followChannel = supabase
    .channel(`activity-follows:${user.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'follows' },
      payload => {
        const newRow = payload.new as any;
        const oldRow = payload.old as any;

        // If current user follows/unfollows someone, refresh the feed
        if (
          newRow?.follower_id === user.id ||
          oldRow?.follower_id === user.id
        ) {
          // Longer delay for unfollow to ensure DB consistency
          const delay = payload.eventType === 'DELETE' ? 500 : 200;
          // Small delay to ensure DB consistency
          setTimeout(() => {
            fetchActivities(0, true);
          }, delay);
        }
      }
    )
    .subscribe();

  return () => {
    followChannel.unsubscribe();
  };
}, [fetchActivities, user?.id]);

  return {
    activities,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
  };
};