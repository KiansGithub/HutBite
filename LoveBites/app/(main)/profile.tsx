import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { GlassPanel } from '@/components/GlassPanel';
import { CTAButton } from '@/components/CTAButton';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import Colors from '@/constants/Colors';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFollow } from '@/hooks/useFollow';
import { useSafety } from '@/hooks/useSafety';

export default function ProfileScreen() {
    const { user, signOut, deleteAccount } = useAuthStore();
    const { profile, loading: profileLoading, createProfile, updateProfile } = useUserProfile();
    const { reportContent, blockUser } = useSafety();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const insets = useSafeAreaInsets();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/auth/sign-in');
        } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);

        try {
            const { error } = await deleteAccount();

            if (error) {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
            } else {
                Alert.alert(
                    'Account Deleted',
                    'Your account has been successfully deleted.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/auth/sign-in'),
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setDeleteLoading(false);
            setShowDeleteDialog(false);
        }
    };

    useEffect(() => {
        if (user && !profile && !profileLoading) {
            createProfile({
                display_name: user.email?.split('@')[0] || 'User',
                is_private: false, 
            });
        }
    }, [user, profile, profileLoading, createProfile]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <LinearGradient 
          colors={['#FF512F', '#F09819', '#FFB347']}
          start={{ x: 0, y: 0}}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <GlassPanel style={styles.profilePanel}>
                        <View style={styles.profileHeader}>
                            <TouchableOpacity 
                              style={styles.avatarContainer}
                              onPress={() => setShowEditProfile(true)}
                            >
                                {profile?.avatar_url ? (
                                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                ) : (
                                    <Ionicons name="person" size={40} color="#fff" />
                                )}
                            </TouchableOpacity>
                            <Text style={styles.displayNameText}>
                                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                            </Text>
                            {profile?.handle && (
                                <Text style={styles.handleText}>@{profile.handle}</Text>
                            )}
                            {profile?.bio && (
                                <Text style={styles.bioText}>{profile.bio}</Text>
                            )}
                            <Text style={styles.emailText}>{user?.email}</Text>
                            <Text style={styles.memberSinceText}>
                                Member since {user?.created_at ? formatDate(user.created_at): 'Unknown'}
                            </Text>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>0</Text>
                                    <Text style={styles.statLabel}>Likes</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>0</Text>
                                    <Text style={styles.statLabel}>Following</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>0</Text>
                                    <Text style={styles.statLabel}>Followers</Text>
                                </View>
                            </View>
                        </View>
                    </GlassPanel>

                    <GlassPanel style={styles.actionsPanel}>
                        <Text style={styles.sectionTitle}>Account Actions</Text>

                        <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color="#fff" />
                            <Text style={styles.actionText}>Sign Out</Text>
                            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </GlassPanel>

                    <TouchableOpacity 
                      style={styles.actionItem}
                      onPress={() => updateProfile({ is_private: !profile?.is_private })}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color="#fff" />
                        <Text style={styles.actionText}>
                            {profile?.is_private ? 'Private Profile' : 'Public Profile'}
                        </Text>
                        <Ionicons 
                          name={profile?.is_private ? "toggle" : "toggle-outline"}
                          size={20}
                          color={profile?.is_private ? Colors.light.primary : "rgba(255,255,255,0.6)"}
                        />
                    </TouchableOpacity>

                    <GlassPanel style={styles.dangerPanel}>
                        <Text style={styles.dangerTitle}>Danger Zone</Text>
                        <Text style={styles.dangerDescription}>
                            Once you delete your account, there is no going back. This will permanently delete your account and remove all associated data. 
                        </Text>

                        <CTAButton 
                          title="Delete Account"
                          onPress={() => setShowDeleteDialog(true)}
                          variant="outline"
                          style={styles.deleteButton}
                          textStyle={styles.deleteButtonText}
                        />
                    </GlassPanel>
                </ScrollView>

                <ConfirmationDialog 
                  visible={showDeleteDialog}
                  title="Delete Account"
                  message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including likes and preferences."
                  confirmText="Delete Account"
                  cancelText="Cancel"
                  onConfirm={handleDeleteAccount}
                  onCancel={() => setShowDeleteDialog(false)}
                  loading={deleteLoading}
                  destructive
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16, 
    },
    backButton: {
        padding: 8
    },
    headerTitle: {
        flex: 1, 
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40
    },
    scrollView: {
        flex: 1, 
        paddingHorizontal: 20, 
    },
    profilePanel: {
        marginBottom: 20, 
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 8, 
    },
    avatarContainer: {
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16, 
    },
    emailText: {
        fontSize: 18, 
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4, 
    },
    memberSinceText: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.7)',
    },
    actionsPanel: {
        marginBottom: 20, 
    },
    sectionTitle: {
        fontSize: 16, 
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16, 
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, 
        paddingHorizontal: 4, 
    },
    actionText: {
        flex: 1, 
        fontSize: 16, 
        color: '#fff',
        marginLeft: 12, 
    },
    dangerPanel: {
        marginBottom: 40, 
    },
    dangerTitle: {
        fontSize: 16, 
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 8, 
    },
    dangerDescription: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20, 
        marginBottom: 20, 
    },
    deleteButton: {
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
    },
    avatar: {
        width: 80, 
        height: 80, 
        borderRadius: 40,
    },
    displayNameText: {
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4, 
    },
    handleText: {
        fontSize: 16, 
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8
    },
    bioText: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 12, 
        paddingHorizontal: 20, 
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 16, 
        paddingTop: 16, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        flex: 1, 
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18, 
        fontWeight: '700',
        color: '#fff'
    },
    statLabel: {
        fontSize: 12, 
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2, 
    },
});