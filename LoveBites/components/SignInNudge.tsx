// @/components/SignInNudge.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useAuthGate } from '@/hooks/useAuthGate';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  /** Height of your TopOverlay (to place the nudge below it). Default: 88 */
  topOverlayHeight?: number;
  /** Persist dismissal between sessions if provided (e.g., "hideSignInNudge_v1") */
  persistDismissKey?: string;
  /** Optional container style override */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional custom title */
  title?: string;
};

const SignInNudge: React.FC<Props> = ({
  topOverlayHeight = 88,
  persistDismissKey,
  containerStyle,
  title = 'Sign in to follow friends and save picks',
}) => {
  const { user } = useAuthStore();
  const { ensureAuthed } = useAuthGate();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  // Restore persisted dismissal (optional)
  useEffect(() => {
    if (!persistDismissKey) return;
    AsyncStorage.getItem(persistDismissKey).then((v) => {
      if (v === '1') setVisible(false);
    });
  }, [persistDismissKey]);

  // Animate in
  useEffect(() => {
    if (!user && visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user, visible, opacity, translateY]);

  if (user || !visible) return null;

  const onClose = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -10, duration: 160, useNativeDriver: true }),
    ]).start(async () => {
      if (persistDismissKey) {
        try {
          await AsyncStorage.setItem(persistDismissKey, '1');
        } catch {}
      }
      setVisible(false);
    });
  };

  const topOffset = insets.top + topOverlayHeight;

  return (
    <Animated.View
      style={[
        styles.signInNudge,
        { top: topOffset, transform: [{ translateY }], opacity },
        containerStyle,
      ]}
      pointerEvents="auto"
    >
      <Text style={styles.nudgeTitle}>{title}</Text>

      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <TouchableOpacity
          onPress={() => ensureAuthed()}
          style={styles.nudgeButton}
          activeOpacity={0.85}
        >
          <Text style={styles.nudgeButtonText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onClose}
        style={styles.nudgeClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      >
        <Text style={styles.nudgeCloseText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SignInNudge;

const styles = StyleSheet.create({
  signInNudge: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 2000,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  nudgeTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  nudgeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  nudgeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  nudgeClose: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nudgeCloseText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '700',
  },
});
