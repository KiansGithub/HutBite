import React from 'react';
import { StyleSheet, Share } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { FAB_SIZE, FAB_RADIUS, FAB_BG, FAB_BLUR } from '@/ui/tokens';

interface ShareButtonProps {
  restaurantName: string;
  menuItemTitle?: string;
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const ShareButton: React.FC<ShareButtonProps> = ({
  restaurantName,
  menuItemTitle,
}) => {
  const handlePress = async () => {
    try {
      await Share.share({
        message: menuItemTitle
          ? `Check out ${menuItemTitle} at ${restaurantName} on LoveBites!`
          : `Check out ${restaurantName} on LoveBites!`,
      });
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <AnimatedBlur
    intensity={FAB_BLUR}
    tint="dark"
    style={styles.fab}
      onTouchEnd={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Share"
    >
      <Ionicons name="send" size={28} color="#ffffff" />
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
});