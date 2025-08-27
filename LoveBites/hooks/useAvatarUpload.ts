import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

export const useAvatarUpload = () => {
    const [uploading, setUploading] = useState(false);
    const { user } = useAuthStore();

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
            return false; 
        }
        return true; 
    };

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null; 

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, 
                allowsEditing: true, 
                aspect: [1, 1], 
                quality: 0.8, 
                selectionLimit: 1, 
                allowsMultipleSelection: false, 
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0];
            }
            return null; 
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
            return null; 
        }
    };

    const uploadFileToSupabase = async (uri: string, fileName: string, contentType: string) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileReader = new FileReader();
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                fileReader.onload = () => {
                    if (fileReader.result instanceof ArrayBuffer) {
                        resolve(fileReader.result);
                    } else {
                        reject(new Error('Failed to convert blob to ArrayBuffer'));
                    }
                };
                fileReader.onerror = () => reject(fileReader.error);
                fileReader.readAsArrayBuffer(blob);
            });

            const { data, error } = await supabase.storage 
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                    contentType, 
                    upsert: true, 
                });
            
            if (error) throw error;
            return data; 
        } catch (error) {
            console.error('Upload error:', error);
            throw error; 
        }
    };

    const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to upload avatar');
            return { success: false, avatarUrl: null };
        }

        setUploading(true);

        try {
            const userId = user.id; 
            const timestamp = Date.now();
            const fileName = `${userId}_${timestamp}.jpg`;

            await uploadFileToSupabase(imageAsset.uri, fileName, 'image/jpeg');

            const { data: avatarData } = supabase.storage 
                .from('avatars')
                .getPublicUrl(fileName);

            return { success: true, avatarUrl: avatarData.publicUrl}
        } catch (error) {
            console.error('Avatar upload failed:', error);
            Alert.alert('Upload Failed', 'There was an error uploading your avatar. Please try again.');
            return { success: false, avatarUrl: null };
        } finally {
            setUploading(false);
        }
     };

     return {
        uploading, 
        pickImage, 
        uploadAvatar,
     };
};