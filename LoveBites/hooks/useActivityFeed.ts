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
  menu_item_id: string;
  restaurant: {
    name: string;
  };
  menu_item: {
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
          menu_item_id,
          created_at,
          user_profiles!inner(
            display_name,
            handle,
            avatar_url,
            is_private
          ),
          restaurants!inner(
            name
          ),
          menu_items!inner(
            title,
            thumb_url
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
 
      const formattedData: ActivityItem[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_profile: item.user_profiles,
        restaurant_id: item.restaurant_id,
        menu_item_id: item.menu_item_id,
        restaurant: item.restaurants,
        menu_item: item.menu_items,
        created_at: item.created_at,
      }));
 
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
  }, [fetchActivities]);
 
  return {
    activities,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
  };
};