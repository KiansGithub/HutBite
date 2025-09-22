import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';

const EditBuildingDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const { buildingDetails, setBuildingDetails } = useCheckout();

  const [buildingType, setBuildingType] = useState(buildingDetails.buildingType || '');
  const [apt, setApt] = useState(buildingDetails.apt || '');
  const [buildingName, setBuildingName] = useState(buildingDetails.buildingName || '');
  const [entryCode, setEntryCode] = useState(buildingDetails.entryCode || '');

  const handleSave = () => {
    setBuildingDetails({ buildingType, apt, buildingName, entryCode });
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Building Details</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. House, Flat, Office, Hotel"
          placeholderTextColor="#999"
          value={buildingType}
          onChangeText={setBuildingType}
        />
        <TextInput
          style={styles.input}
          placeholder="e.g. Flat 2B, Unit 15, Floor 3"
          placeholderTextColor="#999"
          value={apt}
          onChangeText={setApt}
        />
        <TextInput
          style={styles.input}
          placeholder="e.g. Rose Gardens, City Tower"
          placeholderTextColor="#999"
          value={buildingName}
          onChangeText={setBuildingName}
        />
        <TextInput
          style={styles.input}
          placeholder="e.g. #1234, Ring bell twice"
          placeholderTextColor="#999"
          value={entryCode}
          onChangeText={setEntryCode}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 32, // Adjust for close button width
  },
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    padding: 15,
    margin: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditBuildingDetailsScreen;
