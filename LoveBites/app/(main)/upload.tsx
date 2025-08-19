import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useUGCUpload } from '@/hooks/useUGCUpload';
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { MenuItemSelector } from '@/components/MenuItemSelector';
import { CTAButton } from '@/components/CTAButton';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';

export default function UploadScreen() {
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [menuItemId, setMenuItemId] = useState<string>('');
  const [menuItemName, setMenuItemName] = useState<string>('');
  const [suggestedRestaurantName, setSuggestedRestaurantName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { uploading, uploadProgress, pickVideo, uploadUGCVideo } = useUGCUpload();

  const handleVideoSelect = async () => {
    const video = await pickVideo();
    if (video) {
      setSelectedVideo(video);
      setVideoThumbnail(null); // Reset thumbnail state
      // Generate thumbnail for better preview
      const { generateThumbnail } = useUGCUpload();
      generateThumbnail(video.uri)
        .then(thumbnail => {
          if (thumbnail) {
            setVideoThumbnail(thumbnail);
          }
        })
        .catch(error => {
          console.warn('Thumbnail generation failed:', error);
          // Continue without thumbnail - not critical
        });
    }
  };

  const handleRestaurantSelect = (id: string, name: string) => {
    setRestaurantId(id);
    setRestaurantName(name);
    setSuggestedRestaurantName(''); // Clear custom name when selecting from list
    // Clear menu item selection when restaurant changes
    setMenuItemId('');
    setMenuItemName('');
  };

  const handleCustomRestaurantName = (name: string) => {
    setSuggestedRestaurantName(name);
    setRestaurantId(''); // Clear selected restaurant when using custom name
    setRestaurantName('');
    // Clear menu item selection
    setMenuItemId('');
    setMenuItemName('');
  };

  const handleMenuItemSelect = (id: string, name: string) => {
    setMenuItemId(id);
    setMenuItemName(name);
  };

  const handleUpload = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upload videos', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/sign-in') },
      ]);
      return;
    }

    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    const result = await uploadUGCVideo(selectedVideo, {
      restaurantId: restaurantId || undefined,
      menuItemId: menuItemId || undefined,
      suggestedRestaurantName: suggestedRestaurantName || undefined,
      title,
      description,
    });

    if (result.success) {
      // Reset form
      setSelectedVideo(null);
      setVideoThumbnail(null);
      setRestaurantId('');
      setRestaurantName('');
      setMenuItemId('');
      setMenuItemName('');
      setSuggestedRestaurantName('');
      setTitle('');
      setDescription('');

      // Navigate back to feed
      router.push('/(main)/feed');
    }
  };

  const canUpload = selectedVideo && title.trim() && (restaurantId || suggestedRestaurantName.trim());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Selection */}
        <TouchableOpacity
          style={styles.videoSelector}
          onPress={handleVideoSelect}
          disabled={uploading}
        >
          {selectedVideo ? (
            <View style={styles.selectedVideoContainer}>
              {videoThumbnail ? (
                <Image source={{ uri: videoThumbnail }} style={styles.videoThumbnail} />
              ) : (
                <View style={[styles.videoThumbnail, styles.videoPlaceholderThumb]}>
                  <Ionicons name="videocam" size={48} color="#666" />
                  <Text style={styles.thumbnailGeneratingText}>
                    {videoThumbnail === null ? 'Generating preview...' : 'Preview unavailable'}
                  </Text>
                </View>
              )}
              <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoText}>
                  Video selected • {Math.round((selectedVideo.duration || 0) / 1000)}s
                  {selectedVideo.fileSize && ` • ${(selectedVideo.fileSize / (1024 * 1024)).toFixed(1)}MB`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeVideoButton}
                onPress={handleVideoSelect}
                disabled={uploading}
              >
                <Text style={styles.changeVideoText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="add-circle-outline" size={64} color={Colors.light.primary} />
              <Text style={styles.videoPlaceholderText}>Select Video</Text>
              <Text style={styles.videoPlaceholderSubtext}>Choose a video from your gallery</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          <RestaurantSelector
            selectedRestaurantId={restaurantId}
            selectedRestaurantName={restaurantName || suggestedRestaurantName}
            onRestaurantSelect={handleRestaurantSelect}
            onCustomRestaurantName={handleCustomRestaurantName}
          />

          <MenuItemSelector
            restaurantId={restaurantId}
            selectedMenuItemId={menuItemId}
            selectedMenuItemName={menuItemName}
            onMenuItemSelect={handleMenuItemSelect}
            disabled={!restaurantId}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's in this video?"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!uploading}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us more about this dish..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              editable={!uploading}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
          </View>
        )}

        {/* Upload Button */}
        <View style={styles.uploadButtonContainer}>
          <CTAButton
            title={uploading ? 'Uploading...' : 'Upload Video'}
            onPress={handleUpload}
            disabled={!canUpload || uploading}
            loading={uploading}
            size="large"
          />
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Upload Guidelines</Text>
          <Text style={styles.guidelinesText}>• Videos should be under 60 seconds</Text>
          <Text style={styles.guidelinesText}>• Show food clearly and appetizingly</Text>
          <Text style={styles.guidelinesText}>• All uploads are reviewed before going live</Text>
          <Text style={styles.guidelinesText}>• Be respectful and follow community guidelines</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  videoInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  videoSelector: {
    marginVertical: 20,
  },
  selectedVideoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  changeVideoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeVideoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 12,
  },
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadButtonContainer: {
    marginBottom: 30,
  },
  guidelines: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  videoPlaceholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  thumbnailGeneratingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
