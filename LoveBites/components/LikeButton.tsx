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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    <AnimatedPressable
      onPress={handlePress}
      disabled={loading}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: isLiked, busy: loading, disabled: loading }}
      style={[
        styles.fab,
        animStyle,
        { 
          opacity: loading ? 0.7 : 1,
          shadowColor: isLiked ? '#fff' : '#fff',
          shadowRadius: 15,
          shadowOpacity: 0.9,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        },
        style,
      ]}
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
    </AnimatedPressable>
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
  },
});

export default React.memo(LikeButton);
