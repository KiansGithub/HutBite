import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    SafeAreaView, 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/authStore';
import { GlassPanel } from '@/components/GlassPanel';
import { CTAButton } from '@/components/CTAButton';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import Colors from '@/constants/Colors';

export default function ProfileScreen() {
    const { user, signOut, deleteAccount } = useAuthStore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

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
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <GlassPanel style={styles.profilePanel}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person" size={40} color="#fff" />
                            </View>
                            <Text style={styles.emailText}>{user?.email}</Text>
                            <Text style={styles.memberSinceText}>
                                Member since {user?.created_at ? formatDate(user.created_at): 'Unknown'}
                            </Text>
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
    )
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
});