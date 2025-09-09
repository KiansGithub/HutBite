import React, { useState, useEffect } from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    RefreshControl, 
    TextInput, 
    ActivityIndicator, 
    ScrollView 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useSearch } from '@/hooks/useSearch';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { GlassPanel } from '@/components/GlassPanel';
import { UserCard } from '@/components/UserCard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { RequireAuth } from '@/components/RequireAuth';
import { useTabTheme } from '@/contexts/TabThemeContext';
import { useFocusEffect } from '@react-navigation/native';

interface UserProfile {
    id: string; 
    user_id: string; 
    handle: string | null; 
    display_name: string | null; 
    avatar_url: string | null; 
    bio: string | null; 
    is_private: boolean; 
}

export default function ActivityScreen() {
    const { user } = useAuthStore();
    const colorScheme = useColorScheme();
    const { setTheme } = useTabTheme();
    const themeColors = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { activities, loading, refreshing, hasMore, refresh, loadMore } = useActivityFeed();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [usersLoading, setUserLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    const {
        searchQuery, 
        setSearchQuery, 
        userResults, 
        isSearching, 
        searchType, 
        setSearchType
    } = useSearch([], users);

    useFocusEffect(
        React.useCallback(() => {
            setTheme('light');
        }, [setTheme])
    );

    // Load users for search functionality
    useEffect(() => {
        const loadUsers = async () => {
            if (!user) return;
            
            setUserLoading(true);
            setUsersError(null);
            
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .neq('user_id', user.id)
                    .limit(100);
                
                if (error) throw error;
                setUsers(data || []);
            } catch (error) {
                console.error('Error loading users:', error);
                setUsersError('Failed to load users');
            } finally {
                setUserLoading(false);
            }
        };

        loadUsers();
    }, [user]);

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'now';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
        return `${Math.floor(diffInMinutes / 1440)}d`;
    };

    const renderActivityItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                style={styles.activityItem}
                onPress={() => {
                    router.push({
                        pathname: '/restaurant/[id]',
                        params: {
                            id: item.restaurant_id, 
                            menuItem: item.content.type === 'menu_item' ? item.content.id : undefined,
                            ugcVideo: item.content.type === 'ugc_video' ? item.content.id : undefined,
                        }
                    });
                }}
            >
                <GlassPanel style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                        <View style={styles.avatarContainer}>
                            {item.user_profile.avatar_url ? (
                                <Image source={{ uri: item.user_profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <Ionicons name="person" size={20} color={themeColors.text} />
                            )}
                        </View>
                        <View style={styles.activityText}>
                            <Text style={styles.activityDescription}>
                                <Text style={styles.userName}>
                                    {item.user_profile.display_name || item.user_profile.handle || 'Someone'} 
                                </Text>
                                {' liked '}
                                <Text style={styles.itemName}>{item.content.title}</Text>
                                {' at '}
                                <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
                            </Text>
                            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
                        </View>
                        {item.content.thumb_url && (
                            <Image source={{ uri: item.content.thumb_url }} style={styles.thumbnail} />
                        )}
                    </View>
                </GlassPanel>
            </TouchableOpacity>
        );
    }

    const renderUserItem = ({ item }: { item: UserProfile }) => {
        return (
            <UserCard 
                profile={item}
                onPress={() => {
                    // Navigate to user profile if needed
                    console.log('Navigate to user:', item.handle);
                }}
            />
        );
    };

    return (
        <RequireAuth>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={styles.searchHeader}>
                    <View style={styles.searchContainer}>
                        <GlassPanel style={styles.searchPanel}>
                            <View style={styles.searchInputContainer}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={themeColors.text}
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    style={[styles.searchInput, { color: themeColors.text }]}
                                    placeholder="find your friends..."
                                    placeholderTextColor={themeColors.placeholder}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSearchQuery('')}
                                        style={styles.clearButton}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={themeColors.text}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </GlassPanel>
                    </View>
                </View>

                {/* Show user search results when searching, otherwise show activity feed */}
                {searchQuery.length > 0 ? (
                    <FlatList 
                        data={userResults}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color={themeColors.text} />
                                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Users Found</Text>
                                <Text style={[styles.emptySubtitle, { color: themeColors.text }]}>
                                    Try searching with a different name or handle
                                </Text>
                            </View>
                        }
                    />
                ) : (
                    <FlatList 
                      data={activities}
                      renderItem={renderActivityItem}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
                      refreshControl={
                        <RefreshControl 
                          refreshing={refreshing}
                          onRefresh={refresh}
                          tintColor={themeColors.primary}
                        />
                      }
                      onEndReached={loadMore}
                      onEndReachedThreshold={0.5}
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-outline" size={48} color={themeColors.text} />
                            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Activity Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: themeColors.text }]}>
                                Follow friends to see their likes here
                            </Text>
                        </View>
                      }
                    />
                )}
            </View>
        </RequireAuth>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    searchHeader: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
    },
    searchPanel: {
        padding: 4, 
        borderRadius: 12, 
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: {
        marginHorizontal: 8, 
    },
    searchInput: {
        flex: 1, 
        fontSize: 16, 
        paddingVertical: 8, 
    },
    clearButton: {
        marginLeft: 8,
        padding: 4, 
    },
    listContainer: {
        paddingHorizontal: 20, 
        paddingBottom: 20, 
    },
    activityItem: {
        marginBottom: 12,
    },
    activityCard: {
        padding: 16, 
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12, 
    },
    avatar: {
        width: 40, 
        height: 40,
        borderRadius: 20, 
    },
    activityText: {
        flex: 1, 
    },
    activityDescription: {
        fontSize: 14, 
        lineHeight: 18, 
    },
    userName: {
        fontWeight: '600'
    },
    itemName: {
        fontWeight: '500',
    },
    restaurantName: {
        fontWeight: '500',
    },
    timeAgo: {
        fontSize: 12, 
        marginTop: 2,
    },
    thumbnail: {
        width: 40, 
        height: 40, 
        borderRadius: 8, 
        marginLeft: 8, 
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100, 
    },
    emptyTitle: {
        fontSize: 18, 
        fontWeight: '600',
        marginTop: 16, 
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14, 
        textAlign: 'center',
    },
});