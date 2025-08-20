// LikeButton.tsx
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useLikes } from '@/hooks/useLikes';
import { FAB_SIZE, FAB_RADIUS, FAB_BG, FAB_BLUR } from '@/ui/tokens';

type ContentType = 'menu_item' | 'ugc_video';

interface LikeButtonProps {
  contentType: ContentType;
  contentId: string;
  restaurantId: string;

  /** Optional: use lifted state to avoid double hooks (e.g., when double-tap is handled in VideoPlayer) */
  isLikedExternal?: boolean;
  loadingExternal?: boolean;
  onPressExternal?: () => void;

  /** Optional: style override for container */
  style?: ViewStyle;
  /** Optional: override icon size */
  size?: number;
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const LikeButton: React.FC<LikeButtonProps> = ({
  restaurantId,
  contentType,
  contentId,
  isLikedExternal,
  loadingExternal,
  onPressExternal,
  style,
  size = 30,
}) => {
  // Fallback to local hook when external props not provided
  const hook = useLikes({ restaurantId, contentType, contentId });

  const isLiked = isLikedExternal ?? hook.isLiked;
  const loading = loadingExternal ?? hook.loading;
  const canLike = hook.canLike; // external mode still benefits from this guard
  const toggleLike = onPressExternal ?? hook.toggleLike;

  // Bounce animation when switching into liked state
  const scale = useSharedValue(1);
  useEffect(() => {
    if (isLiked) {
      scale.value = withSpring(1.25, { mass: 0.4, damping: 7 }, () => {
        scale.value = withSpring(1);
      });
    }
  }, [isLiked]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!canLike) return null;

  const handlePress = async () => {
    if (loading) return; // debounce rapid taps while request in-flight

    try {
      // Give a bit stronger haptic on like, softer on unlike
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(
          isLiked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
        );
      }
      await toggleLike();
    } catch (error) {
      console.error('Error in like button press:', error);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: isLiked, busy: loading, disabled: loading }}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, style]}
    >
      <AnimatedBlur
        intensity={FAB_BLUR}
        tint="dark"
        style={[styles.fab, animStyle, isLiked && styles.fabLiked]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ff3040" />
        ) : (
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={size}
            color={isLiked ? '#ff3040' : '#ffffff'}
          />
        )}
      </AnimatedBlur>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FAB_BG,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabLiked: {
    shadowColor: '#ff4757',
  },
});

export default React.memo(LikeButton);
