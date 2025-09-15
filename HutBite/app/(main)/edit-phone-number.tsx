import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';
import PhoneInput from 'react-native-phone-number-input';
import { parsePhoneNumber } from 'awesome-phonenumber';

const pickInitial = (e164?: string) => {
  if (!e164) return { iso2: 'GB' as const, national: '' };
  const pn = parsePhoneNumber(e164);
  if (!pn.valid) return { iso2: 'GB' as const, national: e164 };
  return {
    iso2: (pn.regionCode || 'GB') as any,
    national: pn.number?.national || '',
  };
};

const EditPhoneNumberScreen = () => {
  const insets = useSafeAreaInsets();
  const { contact, setContact, setPhoneValid } = useCheckout();
  const phoneRef = useRef<PhoneInput>(null);

  // derive initial ISO2 + national from stored E.164
  const { iso2, national: initialNational } = useMemo(() => pickInitial(contact.phone), [contact.phone]);

  // 🔑 keep NATIONAL in state (no +CC), let the component add the prefix visually
  const [national, setNational] = useState<string>(initialNational);
  const [isValid, setIsValid] = useState<boolean>(Boolean(contact.phone));

  const handleChangeText = (nat: string) => {
    setNational(nat);
    const valid = phoneRef.current?.isValidNumber(nat) ?? false;
    setIsValid(valid);
    setPhoneValid(valid); // keep context validity in sync
  };

  const handleSave = () => {
    if (!isValid) return;

    // Convert NATIONAL -> E.164 once, using the library helper
    const res = phoneRef.current?.getNumberAfterPossiblyEliminatingZero(national);
    const e164 = res?.formattedNumber?.replace(/\s+/g, '') || '';

    setContact({ phone: e164 });   // store normalized E.164 (single +CC)
    setPhoneValid(true);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Number</Text>
      </View>

      <View style={styles.formContainer}>
        <PhoneInput
          ref={phoneRef}
          defaultCode={iso2}     // stable ISO2 region
          value={national}       // CONTROL WITH NATIONAL ONLY
          layout="first"
          onChangeText={handleChangeText}
          // don't use onChangeFormattedText to set state — that’s where double +CC creeps in
          withShadow
          autoFocus
          containerStyle={styles.input}
          textContainerStyle={styles.textContainer}
          textInputProps={{
            placeholder: 'Phone number',
            returnKeyType: 'done',
            onSubmitEditing: () => Keyboard.dismiss(),
            blurOnSubmit: true,
          }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isValid}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  closeButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginRight: 32 },
  formContainer: { padding: 20 },
  input: { width: '100%', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 5, fontSize: 16 },
  textContainer: { backgroundColor: 'transparent' },
  saveButton: { backgroundColor: Colors.light.primary, borderRadius: 10, padding: 15, margin: 20, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: Colors.light.border },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default EditPhoneNumberScreen;
