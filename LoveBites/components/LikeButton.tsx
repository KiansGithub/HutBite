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
      intensity={40}
      tint="dark"
      style={[styles.wrapper, animStyle]}
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
  wrapper: {
    position: 'absolute',
    right: 24,
    top: '42%',
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // tilt shadow slightly red so it “glows” when liked
    shadowColor: '#ff3040',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },
});