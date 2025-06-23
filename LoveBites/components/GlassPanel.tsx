import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
 
interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}
 
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  style,
  intensity = 60
}) => (
  <BlurView intensity={intensity} tint="light" style={[styles.panel, style]}>
    <LinearGradient
      colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]}
      style={StyleSheet.absoluteFill}
    />
    {children}
  </BlurView>
);
 
const styles = StyleSheet.create({
  panel: {
    borderRadius: 32,
    overflow: "hidden",
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
});