// LikeButton.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
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

interface LikeButtonProps {
  restaurantId: string;
  menuItemId: string;
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const LikeButton: React.FC<LikeButtonProps> = ({
  restaurantId,
  menuItemId,
}) => {
  const { isLiked, loading, toggleLike, canLike } = useLikes({
    restaurantId,
    menuItemId,
  });

  const scale = useSharedValue(1);

  // Kick the bounce whenever isLiked flips true
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
    // Fire the haptic before awaiting anything
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(); // optimistic – the hook can undo if server errors
  };

  return (
    <AnimatedBlur
    intensity={FAB_BLUR}
    tint="dark"
    style={[styles.fab, animStyle, isLiked && styles.fabLiked]}
      onTouchEnd={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: isLiked, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ff3040" />
      ) : (
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={30}
          color={isLiked ? '#ff3040' : '#ffffff'}
        />
      )}
    </AnimatedBlur>
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