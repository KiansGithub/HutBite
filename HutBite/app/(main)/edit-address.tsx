import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';
import { addressyFind, addressyRetrieve, normalizePostcode, outwardCode } from '@/services/addressService';
import { AddressySuggestion } from '@/types/addressy';
import debounce from 'lodash.debounce';

const REQUIRED_POSTCODE_OUTWARD_FROM_STORE = undefined as unknown as string;
// ^ If you already captured a store-validated postcode earlier in the flow,
// pass it into this screen via params/context and set it here, e.g. "EN7".

const EditAddressScreen = () => {
  const insets = useSafeAreaInsets();
  const { setAddressDetails } = useCheckout();

  // Single text input for everything (postcode, street, full address)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [containerStack, setContainerStack] = useState<string | undefined>(undefined); // drill-down container

  const runFind = useCallback(async (text: string, container?: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const res = await addressyFind(text.trim(), container);
    setSuggestions(res);
    setLoading(false);
  }, []);

  const debouncedFind = useMemo(() => debounce(runFind, 280), [runFind]);

  useEffect(() => {
    debouncedFind(query, containerStack);
  }, [query, containerStack, debouncedFind]);

  const handleSuggestionPress = async (item: AddressySuggestion) => {
    // If it's not a full address yet (e.g., Postcode/Street/Locality), drill down
    if (item.Type !== 'Address') {
      setContainerStack(item.Id); // next find() will search within this container
      // Also replace the list with children of the container (no need to clear query)
      return;
    }

    // Full Address → Retrieve full components
    const details = await addressyRetrieve(item.Id);
    if (!details) return;

    const line1 = (details.Line1 || '').trim();
    const line2 = (details.Line2 || '').trim();
    const line3 = (details.Line3 || '').trim();
    const city = (details.City || '').trim();
    const postalCode = (details.PostalCode || '').trim();
 
    // Build address string properly, avoiding leading commas
    const addressParts = [line1, line2, line3].filter(part => part.length > 0);
    const fullAddress = addressParts.join(', ');

    // Optional: delivery eligibility check against a known outward code
    if (REQUIRED_POSTCODE_OUTWARD_FROM_STORE) {
      const need = outwardCode(REQUIRED_POSTCODE_OUTWARD_FROM_STORE);
      const got = outwardCode(postalCode);
      if (need && got && need !== got) {
        Alert.alert(
          'Outside delivery area',
          `This address (${postalCode}) is not in our ${need} delivery area.`
        );
        return;
      }
    }

    console.log('Setting address details in edit-address.tsx:', {
      address: fullAddress,
      city,
      postalCode,
    });

    setAddressDetails({
      address: fullAddress,
      city,
      postalCode,
    });

    router.back();
  };

  const handleBackContainer = () => {
    // Reset container drill-down (go up one level). For simplicity, jump to root:
    setContainerStack(undefined);
    setSuggestions([]);
    if (query) runFind(query);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Start typing your address or postcode"
          autoCapitalize="characters"
          value={query}
          onChangeText={setQuery}
        />

        {containerStack && (
          <TouchableOpacity onPress={handleBackContainer} style={styles.breadcrumb}>
            <Ionicons name="chevron-back" size={18} color={Colors.light.primary} />
            <Text style={{ color: Colors.light.primary }}>Back to wider results</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

        {suggestions.length > 0 && (
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(it) => it.Id}
            style={styles.suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSuggestionPress(item)} style={styles.suggestionItem}>
                <Text>
                  {item.Text}
                  {item.Description ? `, ${item.Description}` : ''}
                </Text>
                <Text style={styles.typePill}>{item.Type}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <Text style={styles.powered}>Suggestions powered by Addressy</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  iconButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  input: {
    backgroundColor: '#f0f0f0', borderRadius: 10, padding: 15, fontSize: 16,
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 10, marginTop: 10, maxHeight: 280,
    borderColor: '#eee', borderWidth: 1,
  },
  suggestionItem: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  typePill: {
    fontSize: 12, opacity: 0.6,
  },
  powered: { marginTop: 10, fontSize: 12, opacity: 0.6 },
});

export default EditAddressScreen;
