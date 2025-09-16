// components/checkout/OrderTypeSelector.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { OrderType } from '@/types/store';
import { useStore } from '@/contexts/StoreContext';

export function OrderTypeSelector({ error }: { error?: string }) {
  const { orderType, setOrderType } = useStore();

  const Opt = ({
    type,
    icon,
    label,
  }: {
    type: OrderType;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
  }) => {
    const selected = orderType.toUpperCase() === type;
    return (
      <Pressable
        onPress={() => setOrderType(type.toLowerCase() as OrderType)}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        style={[
          styles.opt,
          selected && styles.optSelected,
          // left/right rounded
          type === 'DELIVERY' ? styles.left : styles.right,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={selected ? '#fff' : Colors.light.text}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.optLabel, selected && { color: '#fff' }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.segment, orderType == null && styles.segmentUnselected]}>
        <Opt type="DELIVERY" icon="bicycle-outline" label="Delivery" />
        <Opt type="COLLECTION" icon="storefront-outline" label="Collection" />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  segment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E7',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  segmentUnselected: {
    // subtle hint when nothing selected
    borderColor: '#FFB3B3',
  },
  opt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,          // slimmer than before
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  optSelected: {
    backgroundColor: Colors.light.primary, // your theme primary
  },
  left: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#E5E5E7' },
  right: {},
  optLabel: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  error: { marginTop: 6, color: Colors.light.error, fontSize: 12 },
});
