import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import type { IStoreProfile } from '@/types/store';
import { MenuRoute } from '@/hooks/useMenuNavigation';

const colors = Colors.light;

export interface MenuHeaderProps {
  storeProfile: IStoreProfile | null;
  route: MenuRoute;
  topPadding: number;
  onBackPress: () => void;
}

export function MenuHeader({ storeProfile, route, topPadding, onBackPress }: MenuHeaderProps) {
  return (
    <LinearGradient
      colors={[colors.primaryStart, colors.primaryEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientTop, { paddingTop: topPadding }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.headerIcon}
        >
          <Ionicons name={route === 'options' ? 'chevron-back' : 'close'} size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{storeProfile?.StoreName || 'Restaurant'}</Text>
          <Text style={styles.headerPill}>{route === 'options' ? 'Choose options' : 'Open'}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="information-circle-outline" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="share-outline" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientTop: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12 
  },
  headerIcon: {
    height: 36, 
    width: 36, 
    borderRadius: 18,
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, 
    borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 4 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  headerPill: {
    color: '#fff', 
    fontSize: 12, 
    paddingHorizontal: 8, 
    paddingVertical: 2,
    borderRadius: 10, 
    backgroundColor: 'rgba(255,255,255,0.22)', 
    overflow: 'hidden',
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 8 
  },
});
