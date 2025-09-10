// components/checkout/DeliveryDetails.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useStore } from '@/contexts/StoreContext';

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isTitleRed?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, title, subtitle, onPress, isTitleRed }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <Ionicons name={icon} size={24} color={Colors.light.text} style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={[styles.rowTitle, isTitleRed && styles.redTitle]}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={22} color={Colors.light.medium} />
  </TouchableOpacity>
);

export const DeliveryDetails = () => {
  const { addressDetails, buildingDetails, deliveryInstructions, contact, orderType } = useCheckout();
  const { postcode, storeInfo } = useStore();

  // DELIVERY mode state
  const hasAddress =
    !!(addressDetails.address?.trim() || addressDetails.city?.trim() || addressDetails.postalCode?.trim());

  const addressTitle = hasAddress ? (addressDetails.address || 'Address') : 'Add delivery address';
  const addressSubtitle = hasAddress
    ? [addressDetails.address, addressDetails.city, addressDetails.postalCode].filter(Boolean).join(', ')
    : (postcode ? `Postcode: ${postcode}` : undefined);

  const hasBuilding =
    !!(buildingDetails.apt?.trim() ||
       buildingDetails.buildingName?.trim() ||
       buildingDetails.entryCode?.trim() ||
       buildingDetails.buildingType?.trim());

  const buildingSubtitle = hasBuilding
    ? [buildingDetails.buildingType, buildingDetails.apt, buildingDetails.buildingName]
        .filter(Boolean)
        .join(' • ')
    : 'Optional (building, unit, entry code)';

  const phoneTitle = contact.phone ? contact.phone : 'Add phone number';

  // COLLECTION mode state
  const pickupTitle = storeInfo?.name || 'Select pickup location';
  const pickupSubtitle = [storeInfo?.address, storeInfo?.postalCode].filter(Boolean).join(', ') || undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {orderType === 'DELIVERY' ? 'Delivery Details' : 'Collection Details'}
      </Text>

      <View style={styles.detailsContainer}>
        {orderType === 'DELIVERY' ? (
          <>
            <DetailRow
              icon="location-outline"
              title={addressTitle}
              subtitle={addressSubtitle}
              onPress={() => router.navigate('/(main)/edit-address')}
              isTitleRed={!hasAddress}
            />
            <View style={styles.separator} />
            <DetailRow
              icon="home-outline"
              title="Building details"
              subtitle={buildingSubtitle}
              onPress={() => router.navigate('/(main)/edit-building-details')}
            />
            <View style={styles.separator} />
          </>
        ) : (
          <>
            <DetailRow
              icon="business-outline"
              title={pickupTitle}
              subtitle={pickupSubtitle}
              onPress={() => router.navigate('/(main)/edit-pickup')} // or your store selector
              isTitleRed={!storeInfo?.name}
            />
            <View style={styles.separator} />
          </>
        )}

        <DetailRow
          icon="trail-sign-outline"
          title={deliveryInstructions ? 'Delivery notes' : 'Add delivery notes'}
          subtitle={deliveryInstructions || undefined}
          onPress={() => router.navigate('/(main)/edit-delivery-instructions')}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="call-outline"
          title={phoneTitle}
          subtitle="Phone Number"
          onPress={() => router.navigate('/(main)/edit-phone-number')}
          isTitleRed={!contact.phone}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginVertical: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  detailsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  icon: { marginRight: 16 },
  textContainer: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  redTitle: { color: Colors.light.error },
  subtitle: { fontSize: 14, color: Colors.light.medium, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border, marginLeft: 56 },
});
