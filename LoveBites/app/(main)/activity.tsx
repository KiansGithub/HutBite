import React from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    RefreshControl, 
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { GlassPanel } from '@/components/GlassPanel';
import Colors from '@/constants/Colors';

export default function ActivityScreen() {
    const { activities, loading, refreshing, hasMore, refresh, loadMore } = useActivityFeed();

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
                    router.push(`/restaurant/${item.restaurant_id}?menuItem=${item.menu_item_id}`);
                }}
            >
                <GlassPanel style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                        <View style={styles.avatarContainer}>
                            {item.user_profile.avatar_url ? (
                                <Image source={{ uri: item.user_profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <Ionicons name="person" size={20} color="#fff" />
                            )}
                        </View>
                        <View style={styles.activityText}>
                            <Text style={styles.activityDescription}>
                                <Text style={styles.userName}>
                                    {item.user_profile.display_name || item.user_profile.handle || 'Someone'} 
                                </Text>
                                {' liked '}
                                <Text style={styles.itemName}>{item.menu_item.title}</Text>
                                {' at '}
                                <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
                            </Text>
                            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
                        </View>
                        {item.menu_item.thumb_url && (
                            <Image source={{ uri: item.menu_item.thumb_url }} style={styles.thumbnail} />
                        )}
                    </View>
                </GlassPanel>
            </TouchableOpacity>
        );
    }

        return (
            <LinearGradient 
              colors={['#FF512F', '#F09819', '#FFB347']}
              start={{ x: 0, y: 0}}
              end={{ x: 1, y: 1}}
              style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Activity</Text>
                    </View>

                    <FlatList 
                      data={activities}
                      renderItem={renderActivityItem}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.listContainer}
                      refreshControl={
                        <RefreshControl 
                          refreshing={refreshing}
                          onRefresh={refresh}
                          tintColor="#fff"
                        />
                      }
                      onEndReached={loadMore}
                      onEndReachedThreshold={0.5}
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-outline" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyTitle}>No Activity Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Follow friends to see their likes here
                            </Text>
                        </View>
                      }
                    />
                </SafeAreaView>
            </LinearGradient>
        );
    }

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    safeArea: {
        flex: 1, 
    },
    header: {
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
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
        color: '#fff',
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
        color: 'rgba(255,255,255,0.7)',
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
        color: '#fff',
        marginTop: 16, 
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
});