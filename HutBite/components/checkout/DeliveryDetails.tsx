import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Details</Text>
      {/* Map placeholder as requested */}
      <View style={styles.detailsContainer}>
        <DetailRow
          icon="location-outline"
          title="Washington Square"
          subtitle="New York, NY, United States"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="home-outline"
          title="Building details*"
          subtitle="e.g. building type, unit #"
          onPress={() => {}}
          isTitleRed
        />
        <View style={styles.separator} />
        <DetailRow
          icon="trail-sign-outline"
          title="Hand it to me"
          subtitle="e.g. ring the bell after dropoff"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <DetailRow
          icon="call-outline"
          title="(702) 665-9987"
          subtitle="Phone Number"
          onPress={() => {}}
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
    color: 'red',
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
