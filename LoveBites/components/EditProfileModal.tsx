import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    TextInput, 
    Image, 
    Alert, 
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/GlassPanel';
import { CTAButton } from '@/components/CTAButton';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useUserProfile } from '@/hooks/useUserProfile';
import Colors from '@/constants/Colors';

interface EditProfileModalProps {
    visible: boolean; 
    onClose: () => void; 
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible, 
    onClose, 
}) => {
    const { profile, updateProfile } = useUserProfile();
    const { uploading, pickImage, uploadAvatar } = useAvatarUpload();

    const [displayName, setDisplayName] = useState('');
    const [handle, setHandle] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setHandle(profile.handle || '');
            setBio(profile.bio || '');
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const handleAvatarUpload = async () => {
        const imageAsset = await pickImage();
        if (!imageAsset) return; 

        const result = await uploadAvatar(imageAsset);
        if (result.success && result.avatarUrl) {
            setAvatarUrl(result.avatarUrl);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const updates = {
                display_name: displayName.trim() || null, 
                handle: handle.trim() || null, 
                bio: bio.trim() || null, 
                avatar_url: avatarUrl, 
            };

            const { error } = await updateProfile(updates);

            if (error) {
                Alert.alert('Error', 'Failed to update profile. Please try again.');
            } else {
                Alert.alert('Success', 'Profile updated successfully!');
                onClose();
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <LinearGradient
                colors={['#FF512F', '#F09819', '#FFB347']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={styles.headerSpacer} />
                </View>
 
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <GlassPanel style={styles.panel}>
                        <View style={styles.avatarSection}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={handleAvatarUpload}
                                disabled={uploading}
                            >
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                                ) : (
                                    <Ionicons name="person" size={40} color="#fff" />
                                )}
                                <View style={styles.avatarOverlay}>
                                    <Ionicons
                                        name={uploading ? "hourglass" : "camera"}
                                        size={20}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.avatarHint}>Tap to change photo</Text>
                        </View>
 
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Display Name</Text>
                            <TextInput
                                style={styles.input}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Your display name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                maxLength={50}
                            />
                        </View>
 
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Handle</Text>
                            <TextInput
                                style={styles.input}
                                value={handle}
                                onChangeText={setHandle}
                                placeholder="username"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                maxLength={30}
                                autoCapitalize="none"
                            />
                        </View>
 
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                multiline
                                maxLength={150}
                            />
                        </View>
 
                        <CTAButton
                            title="Save Changes"
                            onPress={handleSave}
                            loading={saving || uploading}
                            style={styles.saveButton}
                        />
                    </GlassPanel>
                </ScrollView>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingTop: 60, 
        paddingBottom: 20, 
    },
    closeButton: {
        padding: 8, 
    },
    headerTitle: {
        flex: 1, 
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40, 
    },
    scrollView: {
        flex: 1, 
        paddingHorizontal: 20, 
    },
    panel: {
        marginBottom: 40, 
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32, 
    },
    avatarContainer: {
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8, 
        position: 'relative',
    },
    avatar: {
        width: 100, 
        height: 100, 
        borderRadius: 50, 
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0, 
        right: 0, 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: Colors.light.primary, 
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2, 
        borderColor: '#fff',
    },
    avatarHint: {
        fontSize: 12, 
        color: 'rgba(255,255,255,0.7)',
    },
    inputSection: {
        marginBottom: 20
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        marginTop: 20,
    },
})