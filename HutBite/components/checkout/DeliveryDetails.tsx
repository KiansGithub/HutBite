import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { useCheckout } from '@/contexts/CheckoutContext';

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  isTitleRed?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, title, subtitle, onPress, isTitleRed }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <Ionicons name={icon} size={24} color={Colors.light.text} style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={[styles.rowTitle, isTitleRed && styles.redTitle]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color={Colors.light.medium} />
  </TouchableOpacity>
);

export const DeliveryDetails = () => {
  const { addressDetails, buildingDetails, deliveryInstructions, phoneNumber } = useCheckout();

  const addressSubtitle = addressDetails.address
    ? `${addressDetails.address}, ${addressDetails.city}, ${addressDetails.postalCode}`
    : 'New York, NY, United States';

  const buildingSubtitle = buildingDetails.apt || buildingDetails.buildingName
    ? `${buildingDetails.buildingType || ''} ${buildingDetails.apt || ''} ${buildingDetails.buildingName || ''}`.trim()
    : 'e.g. building type, unit #';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Details</Text>
      {/* Map placeholder as requested */}
      <View style={styles.detailsContainer}>
        <DetailRow
          icon="location-outline"
          title={addressDetails.address || 'Washington Square'}
          subtitle={addressSubtitle}
          onPress={() => router.navigate('/(main)/edit-address')}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="home-outline"
          title="Building details*"
          subtitle={buildingSubtitle}
          onPress={() => router.navigate('/(main)/edit-building-details')}
          isTitleRed={!buildingDetails.apt && !buildingDetails.buildingName}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="trail-sign-outline"
          title="Hand it to me"
          subtitle={deliveryInstructions || 'e.g. ring the bell after dropoff'}
          onPress={() => router.navigate('/(main)/edit-delivery-instructions')}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="call-outline"
          title={phoneNumber || '(702) 665-9987'}
          subtitle="Phone Number"
          onPress={() => router.navigate('/(main)/edit-phone-number')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
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
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  redTitle: {
    color: Colors.light.error,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.medium,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginLeft: 56, // Aligns with the text, leaving icon space
  },
});
