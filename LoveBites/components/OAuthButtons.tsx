import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
 
interface OAuthButtonProps {
  onPress: () => void;
  loading?: boolean;
}
 
export const GoogleSignInButton: React.FC<OAuthButtonProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      style={[styles.googleButton, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.9}
    >
      <View style={styles.googleIconContainer}>
        <Text style={styles.googleIcon}>G</Text>
      </View>
      <Text style={styles.googleText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};
 
export const AppleSignInButton: React.FC<OAuthButtonProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      style={[styles.appleButton, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.9}
    >
      <Ionicons name="logo-apple" size={20} color="#fff" style={styles.appleIcon} />
      <Text style={styles.appleText}>Continue with Apple</Text>
    </TouchableOpacity>
  );
};
 
const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4285f4',
    fontFamily: 'Product Sans', // Falls back to system font
  },
  googleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
    marginRight: 32, // Compensate for icon space to center text
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  appleIcon: {
    marginRight: 12,
  },
  appleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 32, // Compensate for icon space to center text
  },
  disabled: {
    opacity: 0.6,
  },
});