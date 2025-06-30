import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OAuthButtonProps {
  onPress: () => void;
  loading?: boolean;
}

/* ------------ GOOGLE BUTTON ------------ */
export const GoogleSignInButton: React.FC<OAuthButtonProps> = ({
  onPress,
  loading,
}) => {
  return (
    <TouchableOpacity
      style={[styles.googleButton, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.9}
    >
      {/* 1️⃣  Replace with your own local logo if you like */}
      <Image
        source={require('@/assets/images/google_logo.png')}
        style={styles.googleLogo}
      />
      {/* 2️⃣  Text is now visually centred, but the icon’s fixed width
              means we need a LITTLE right-hand padding to keep it centred.
              Feel free to tweak the 24 → 28 if your label length changes. */}
      <Text style={styles.googleText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

/* ------------ APPLE BUTTON ------------ */
export const AppleSignInButton: React.FC<OAuthButtonProps> = ({
  onPress,
  loading,
}) => {
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

/* ------------ STYLES ------------ */
const styles = StyleSheet.create({
  /* Google */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
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
  googleLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 12, // tighter than before
  },
  googleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
    marginRight: 24,  // small compensation keeps text dead-centre
  },

  /* Apple */
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
    marginRight: 32, // same centring trick as before
  },

  /* Shared */
  disabled: {
    opacity: 0.6,
  },
});
