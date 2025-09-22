import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';
import { useStore } from '@/contexts/StoreContext';
import PhoneInput from 'react-native-phone-number-input';
import { parsePhoneNumber } from 'awesome-phonenumber';
import { PhoneVerificationModal } from '@/components/checkout/PhoneVerificationModal';
import { validatePhoneNumber, formatPhoneNumber } from '@/services/phoneVerificationService';

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
  const { verifiedPhone, checkPhoneVerification } = usePhoneVerification();
  const { stripeStoreUrl } = useStore();
  const phoneRef = useRef<PhoneInput>(null);

  // derive initial ISO2 + national from stored E.164
  const { iso2, national: initialNational } = useMemo(() => pickInitial(contact.phone), [contact.phone]);

  // keep NATIONAL in state (no +CC), let the component add the prefix visually
  const [national, setNational] = useState<string>(initialNational);
  const [isValid, setIsValid] = useState<boolean>(Boolean(contact.phone));
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingPhoneE164, setPendingPhoneE164] = useState<string>('');

  const handleChangeText = (nat: string) => {
    setNational(nat);
    const valid = phoneRef.current?.isValidNumber(nat) ?? false;
    setIsValid(valid);
    setPhoneValid(valid); // keep context validity in sync
  };

  const handleSave = () => {
    if (!isValid) return;

    // Convert NATIONAL -> E.164 once, using the library helper
    const res = phoneRef.current?.getNumberAfterPossiblyEliminatingZero();
    const e164 = res?.formattedNumber?.replace(/\s+/g, '') || '';

    // Check if this phone number is already verified
    if (checkPhoneVerification(e164)) {
      // Phone is already verified, save directly
      setContact({ phone: e164 });
      setPhoneValid(true);
      router.back();
    } else {
      // Phone needs verification
      if (!stripeStoreUrl) {
        // No store URL available, save without verification (fallback)
        setContact({ phone: e164 });
        setPhoneValid(true);
        router.back();
        return;
      }

      // Show verification modal
      setPendingPhoneE164(e164);
      setShowVerificationModal(true);
    }
  };

  const handleVerificationSuccess = (verifiedPhoneNumber: string) => {
    // Save the verified phone number
    setContact({ phone: verifiedPhoneNumber });
    setPhoneValid(true);
    setShowVerificationModal(false);
    setPendingPhoneE164('');
    router.back();
  };

  const handleVerificationError = (error: string) => {
    console.error('Phone verification error:', error);
    // For now, still save the phone number even if verification fails
    // This ensures users can still place orders
    setContact({ phone: pendingPhoneE164 });
    setPhoneValid(true);
    setShowVerificationModal(false);
    setPendingPhoneE164('');
    router.back();
  };

  const handleVerificationDismiss = () => {
    setShowVerificationModal(false);
    setPendingPhoneE164('');
  };

  // Check if current phone is verified
  const currentPhoneE164 = useMemo(() => {
    if (!isValid || !national) return '';
    const res = phoneRef.current?.getNumberAfterPossiblyEliminatingZero();
    return res?.formattedNumber?.replace(/\s+/g, '') || '';
  }, [isValid, national]);

  const isCurrentPhoneVerified = currentPhoneE164 && checkPhoneVerification(currentPhoneE164);

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
          // don't use onChangeFormattedText to set state — that's where double +CC creeps in
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

        {/* Verification Status */}
        {isValid && (
          <View style={styles.statusContainer}>
            {isCurrentPhoneVerified ? (
              <View style={styles.verifiedStatus}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.success || '#4CAF50'} />
                <Text style={styles.verifiedText}>Phone number verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedStatus}>
                <Ionicons name="information-circle" size={20} color={Colors.light.warning || '#FF9800'} />
                <Text style={styles.unverifiedText}>
                  {currentPhoneE164 !== contact.phone 
                    ? 'New number will be verified when saved'
                    : 'Phone verification required for orders'
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isValid}
      >
        <Text style={styles.saveButtonText}>
          {isCurrentPhoneVerified || currentPhoneE164 === contact.phone ? 'Save' : 'Save & Verify'}
        </Text>
      </TouchableOpacity>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        visible={showVerificationModal}
        phoneNumber={pendingPhoneE164}
        storeUrl={stripeStoreUrl || ''}
        onVerificationSuccess={handleVerificationSuccess}
        onVerificationError={handleVerificationError}
        onDismiss={handleVerificationDismiss}
      />
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
  statusContainer: { 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa' 
  },
  verifiedStatus: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  unverifiedStatus: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  verifiedText: { 
    marginLeft: 8, 
    color: Colors.light.success || '#4CAF50', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  unverifiedText: { 
    marginLeft: 8, 
    color: Colors.light.warning || '#FF9800', 
    fontSize: 14 
  },
  saveButton: { backgroundColor: Colors.light.primary, borderRadius: 10, padding: 15, margin: 20, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: Colors.light.border },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default EditPhoneNumberScreen;
