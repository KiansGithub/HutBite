import React from 'react';
import { StyleSheet, Share } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

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
      intensity={40}
      tint="dark"
      style={styles.wrapper}
      onTouchEnd={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Share"
    >
      <Ionicons name="share-social-outline" size={28} color="#ffffff" />
    </AnimatedBlur>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 24,
    top: '0%',
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
});
