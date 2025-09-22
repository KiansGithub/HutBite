// app/(main)/store-address.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';

export default function StoreAddressScreen() {
  const insets = useSafeAreaInsets();
  const { storeInfo } = useStore();

  const openInMaps = () => {
    if (!storeInfo?.address) {
      Alert.alert('Address not available', 'Restaurant address is not available at the moment.');
      return;
    }

    const address = `${storeInfo.address}${storeInfo.postalCode ? ', ' + storeInfo.postalCode : ''}`;
    const encodedAddress = encodeURIComponent(address);
    
    // Try to open in native maps app first, fallback to Google Maps web
    const mapsUrl = `maps://app?q=${encodedAddress}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mapsUrl);
        } else {
          return Linking.openURL(googleMapsUrl);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open maps application.');
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Collection Address</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.addressCard}>
          <View style={styles.storeHeader}>
            <Ionicons name="business" size={32} color={Colors.light.primary} />
            <Text style={styles.storeName}>{storeInfo?.name || 'Restaurant'}</Text>
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.addressLabel}>Collection Address:</Text>
            <Text style={styles.addressText}>
              {storeInfo?.address || 'Address not available'}
            </Text>
            {storeInfo?.postalCode && (
              <Text style={styles.addressText}>{storeInfo.postalCode}</Text>
            )}
          </View>

          {storeInfo?.openingHours && (
            <View style={styles.hoursSection}>
              <Text style={styles.hoursLabel}>Opening Hours:</Text>
              <Text style={styles.hoursText}>{storeInfo.openingHours}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.mapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Collection Instructions</Text>
          <Text style={styles.infoText}>
            • Please arrive at the scheduled collection time{'\n'}
            • Show your order confirmation to staff{'\n'}
            • Check your order before leaving
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  headerSpacer: {
    height: 36,
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 12,
  },
  addressSection: {
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.medium,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  hoursSection: {
    marginBottom: 20,
  },
  hoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.medium,
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.medium,
    lineHeight: 20,
  },
});
