import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFollow } from '@/hooks/useFollow';
import Colors from '@/constants/Colors';

interface FollowButtonProps {
    targetUserId: string; 
    style?: any; 
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId, style }) => {
    const { isFollowing, loading, toggleFollow, canFollow } = useFollow({ targetUserId });

    if (!canFollow) return null; 

    return (
        <TouchableOpacity 
          style={[
            styles.button, 
            isFollowing ? styles.followingButton : styles.followButton, 
            style, 
          ]}
          onPress={toggleFollow}
          disabled={loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color={isFollowing ? '#666' : '#fff'} />
            ) : (
                <Text style={[
                    styles.buttonText, 
                    isFollowing ? styles.followingText : styles.followText, 
                ]}>
                    {isFollowing ? 'Following' : 'Follow'}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 20, 
        paddingVertical: 8, 
        borderRadius: 20, 
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80
    },
    followButton: {
        backgroundColor: Colors.light.primary
    },
    followingButton: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1, 
        borderColor: 'rgba(0,0,0,0.2)',
    },
    buttonText: {
        fontSize: 14, 
        fontWeight: '600',
    },
    followText: {
        color: '#fff',
    },
    followingText: {
        color: '#000',
    },
});