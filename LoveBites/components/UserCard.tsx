import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassPanel } from './GlassPanel';
import { FollowButton } from './FollowButton';
import { useFollow } from '@/hooks/useFollow';

interface UserProfile {
    id: string; 
    user_id: string; 
    handle: string | null; 
    display_name: string | null; 
    avatar_url: string | null; 
    bio: string | null; 
    is_private: boolean; 
}

interface UserCardProps {
    profile: UserProfile; 
    onPress?: () => void; 
}

export const UserCard: React.FC<UserCardProps> = ({ profile, onPress }) => {
    const { followersCount } = useFollow({ targetUserId: profile.user_id });

    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    return (
        <GlassPanel style={styles.container}>
            <TouchableOpacity style={styles.content} onPress={handlePress}>
                <View style={styles.leftSection}>
                    <View style={styles.avatarContainer}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <Ionicons name="person" size={24} color="#fff" />
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.displayName}>
                            {profile.display_name || 'User'}
                        </Text>
                        {profile.handle && (
                            <Text style={styles.handle}>@{profile.handle}</Text>
                        )}
                        {profile.bio && (
                            <Text style={styles.bio} numberOfLines={2}>
                                {profile.bio}
                            </Text>
                        )}
                        <View style={styles.statsRow}>
                            <Text style={styles.followers}>
                                {followersCount} followers
                            </Text>
                            {profile.is_private && (
                                <View style={styles.privateIndicator}>
                                    <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.privateText}>Private</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <FollowButton targetUserId={profile.user_id} />
            </TouchableOpacity>
        </GlassPanel>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        borderRadius: 44
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0, 
    },
    leftSection: {
        flex: 1, 
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40, 
        height: 40, 
        borderRadius: 25, 
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12, 
    },
    avatar: {
        width: 40, 
        height: 40, 
        borderRadius: 25, 
    },
    userInfo: {
        flex: 1, 
    },
    displayName: {
        fontSize: 16, 
        fontWeight: '600',
        color: "#fff",
        marginBottom: 2, 
    },
    handle: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4, 
    },
    bio: {
        fontSize: 13, 
        color: 'rgba(255,255,255,0.8)', 
        lineHeight: 18, 
        marginBottom: 6
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    followers: {
        fontSize: 12, 
        color: 'rgba(255,255,255,0.6)',
        marginRight: 12, 
    },
    privateIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    privateText: {
        fontSize: 12, 
        color: 'rgba(255,255,255,0.7)', 
        marginLeft: 4, 
    },
});