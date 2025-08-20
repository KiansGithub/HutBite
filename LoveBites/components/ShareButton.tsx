import React from 'react';
import { StyleSheet, Share, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB_SIZE, FAB_RADIUS, FAB_BG } from '@/ui/tokens';

const iosLink = 'https://apps.apple.com/app/id6747894985';
const androidLink = 'https://play.google.com/store/apps/details?id=com.livebites.livebites';
const link = Platform.OS === 'ios' ? iosLink : androidLink;

interface ShareButtonProps {
  restaurantName: string;
  menuItemTitle?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  restaurantName,
  menuItemTitle,
}) => {
  const handlePress = async () => {
    const sharedMessage = menuItemTitle
      ? `Check out ${menuItemTitle} at ${restaurantName} on LiveBites!`
      : `Check out ${restaurantName} on LoveBites!`;
  
    const fullMessage = `${sharedMessage}\n\niOS: ${iosLink}\nAndroid: ${androidLink}`;
  
    try {
      await Share.share({ message: fullMessage });
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.fab,
        { 
          opacity: pressed ? 0.7 : 1,
          shadowColor: '#fff',
          shadowRadius: 15,
          shadowOpacity: 0.9,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        }
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Share"
    >
      <Ionicons name="send" size={28} color="#ffffff" style={{ transform: [{ rotate: '-45deg' }] }}/>
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
  },
});