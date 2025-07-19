import React from 'react';
import { StyleSheet, Share, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { FAB_SIZE, FAB_RADIUS, FAB_BG, FAB_BLUR } from '@/ui/tokens';

const iosLink = 'https://apps.apple.com/app/id6747894985';
const androidLink = 'https://play.google.com/store/apps/details?id=com.livebites.livebites';
const link = Platform.OS === 'ios' ? iosLink : androidLink;

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
        ? `Check out ${menuItemTitle} at ${restaurantName} on LoveBites!\n${link}`
        : `Check out ${restaurantName} on LoveBites!\n${link}`,
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
      <Ionicons name="send" size={28} color="#ffffff" style={{ transform: [{ rotate: '-45deg' }] }}/>
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