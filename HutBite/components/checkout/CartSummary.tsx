// components/checkout/OrderSummary.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { useCheckout } from '@/contexts/CheckoutContext';
import type { OrderType } from '@/types/store';

export const CartSummary = () => {
  const { totals, orderType } = useCheckout(); // <-- live values
  // totals has: subtotal, delivery, service, tip, total (strings)
  // and *_Num numeric versions if needed

  // Optionally hide rows that are zero (e.g., delivery on COLLECTION, no tip yet)
  const showDelivery = orderType === ('DELIVERY' as OrderType) && totals.deliveryNum > 0;
  const showService  = totals.serviceNum > 0;
  const showTip      = totals.tipNum > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary</Text>

      <Row label="Subtotal" value={totals.subtotal} />

      {showDelivery && <Row label="Delivery Fee" value={totals.delivery} />}
      {showService && <Row label="Fees & Estimated Tax" value={totals.service} />}
      {showTip && <Row label="Courier Tip" value={totals.tip} />}

      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalText}>{totals.total}</Text>
      </View>
    </View>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text>{label}</Text>
    <Text>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalRow: { borderTopWidth: 1, borderColor: '#ccc', paddingTop: 10, marginTop: 10 },
  totalText: { fontWeight: 'bold', fontSize: 16 },
});
