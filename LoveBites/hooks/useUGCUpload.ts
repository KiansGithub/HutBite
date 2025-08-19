import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

interface UGCUploadData {
    restaurantId?: string; 
    menuItemId?: string; 
    suggestedRestaurantName?: string; 
    title: string; 
    description?: string; 
}

export const useUGCUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { user } = useAuthStore();

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload videos.');
            return false; 
        }
        return true; 
    };

    const pickVideo = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null; 

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false, 
                quality: 0.8, 
                videoMaxDuration: 60,
                selectionLimit: 1, 
                allowsMultipleSelection: false, 
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0];
            }
            return null; 
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to pick video');
            return null; 
        }
    };

    const generateThumbnail = async (videoUri: string) => {
        try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
                time: 1000, 
                quality: 0.7,
            });
            return uri; 
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null; 
        }
    };

    const uploadFileToSupabase = async (uri: string, fileName: string, contentType: string) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            // Convert blob to ArrayBuffer for React Native
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
              .from('ugc-videos')
              .upload(fileName, arrayBuffer, {
                contentType, 
                upsert: false, 
              });
            
            if (error) throw error; 
            return data; 
        } catch (error) {
            console.error('Upload error:', error);
            throw error; 
        }
    };

    const uploadUGCVideo = async (videoAsset: ImagePicker.ImagePickerAsset, uploadData: UGCUploadData) => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to upload videos');
            return { success: false };
        }

        if (!uploadData.title.trim()) {
            Alert.alert('Error', 'Please provide a title for your video');
            return { success: false };
        }

        if (!uploadData.restaurantId && !uploadData.suggestedRestaurantName?.trim()) {
            Alert.alert('Error', 'Please select a restaurant or provide a restaurant name');
            return { success: false };
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Genrate unique filenames 
            const videoId = typeof uuid.v4() === 'string' ? uuid.v4() : String(uuid.v4());
            const timestamp = Date.now();
            const videoFileName = `${videoId}_${timestamp}.mp4`;
            const thumbFileName = `${videoId}_${timestamp}_thumb.jpg`;

            setUploadProgress(20);

            // Generate thumbnail 
            const thumbnailUri = await generateThumbnail(videoAsset.uri);
            setUploadProgress(40);

            // Upload video 
            await uploadFileToSupabase(videoAsset.uri, videoFileName, 'video/mp4');
            setUploadProgress(70);

            // Upload thumbnail if generated 
            let thumbUrl = null; 
            if (thumbnailUri) {
                await uploadFileToSupabase(thumbnailUri, thumbFileName, 'image/jpeg');
                const { data: thumbData } = supabase.storage 
                  .from('ugc-videos')
                  .getPublicUrl(thumbFileName);
                thumbUrl = thumbData.publicUrl; 
            }

            setUploadProgress(85);

            // Get video public URL 
            const { data: videoData } = supabase.storage 
              .from('ugc-videos')
              .getPublicUrl(videoFileName);

            // Insert record into ugc_videos table 
            const { error: insertError } = await supabase 
              .from('ugc_videos')
              .insert({
                user_id: user.id, 
                restaurant_id: uploadData.restaurantId || null, 
                menu_item_id: uploadData.menuItemId || null, 
                suggested_restaurant_name: uploadData.suggestedRestaurantName || null, 
                video_url: videoData.publicUrl, 
                thumb_url: thumbUrl, 
                title: uploadData.title.trim(),
                description: uploadData.description || null, 
                status: 'pending',
              });
            
            if (insertError) throw insertError; 

            setUploadProgress(100);
            Alert.alert('Success!', 'Your video has been uploaded and is pending review.');

            return { success: true };
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Upload Failed', 'There was an error uploading your video. Please try again.');
            return { success: false };
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return {
        uploading,
        uploadProgress, 
        pickVideo, 
        uploadUGCVideo, 
    };
};