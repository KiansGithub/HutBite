// components/checkout/AddressForm.tsx
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { Card, HelperText, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import RNPhoneInput from 'react-native-phone-number-input';
import { parsePhoneNumber } from 'awesome-phonenumber';

// Cast for React 19 typings
const PhoneInput = RNPhoneInput as unknown as React.ComponentType<any>;

interface AddressFormProps {
  address: string;
  city: string;
  postalCode: string;
  instructions: string;
  phone: string;
  errors: { address?: string; city?: string; postalCode?: string; phone?: string };
  onAddressChange: (text: string) => void;
  onCityChange: (text: string) => void;
  onPostalCodeChange: (text: string) => void;
  onInstructionsChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onPhoneValidityChange: (isValid: boolean) => void;
  isLoading: boolean;
  disabled?: boolean;
  isPhoneNumberEditable?: boolean;
  testID?: string;
  wrapInCard?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  city,
  postalCode,
  instructions,
  phone,
  errors,
  onAddressChange,
  onCityChange,
  onPostalCodeChange,
  onInstructionsChange,
  onPhoneChange,
  onPhoneValidityChange,
  isLoading = false,
  disabled = false,
  isPhoneNumberEditable = true,
  testID = 'address-form',
  wrapInCard = true,
}) => {
  const theme = useTheme();
  const phoneRef = useRef<any>(null);

  // Default to GB (you’re charging in GBP). Fall back smartly.
  const pn = parsePhoneNumber(phone || '', { regionCode: 'GB' });
  const defaultRegion = (pn.valid && pn.regionCode ? pn.regionCode : 'GB').toUpperCase();
  const nationalNumber = pn.valid ? pn.number.national : phone;

  const Content = (
    <View style={styles.sectionBody}>
      {/* Address */}
      <TextInput
        mode="outlined"
        label="Street address"
        value={address}
        onChangeText={onAddressChange}
        style={styles.input}
        disabled={disabled}
        error={!!errors.address}
        left={<TextInput.Icon icon={() => <MaterialIcons name="home" size={20} color={theme.colors.primary} />} />}
      />
      <HelperText type="error" visible={!!errors.address} style={styles.helper}>
        {errors.address}
      </HelperText>

      {/* City + Postal code */}
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          label="City"
          value={city}
          onChangeText={onCityChange}
          style={[styles.input, styles.half]}
          disabled={disabled}
          error={!!errors.city}
          left={<TextInput.Icon icon={() => <MaterialIcons name="location-city" size={20} color={theme.colors.primary} />} />}
        />
        <TextInput
          mode="outlined"
          label="Postal code"
          value={postalCode}
          onChangeText={onPostalCodeChange}
          style={[styles.input, styles.half, styles.leftGap]}
          disabled={disabled}
          error={!!errors.postalCode}
          left={<TextInput.Icon icon={() => <MaterialIcons name="mail" size={20} color={theme.colors.primary} />} />}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>
      <HelperText type="error" visible={!!errors.city || !!errors.postalCode} style={styles.helper}>
        {errors.city || errors.postalCode}
      </HelperText>

      {/* Delivery instructions */}
      <TextInput
        mode="outlined"
        label="Delivery instructions (optional)"
        value={instructions}
        onChangeText={onInstructionsChange}
        style={styles.input}
        disabled={disabled}
        multiline
        numberOfLines={3}
        left={<TextInput.Icon icon={() => <MaterialIcons name="notes" size={20} color={theme.colors.primary} />} />}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
      />

      {/* Phone */}
      <View style={[styles.phoneWrapper, { borderColor: theme.colors.outline }]}>
        <PhoneInput
          ref={phoneRef}
          value={nationalNumber}
          defaultCode={defaultRegion}
          layout="first"
          onChangeText={(text: string) => {
            const isValid = phoneRef.current?.isValidNumber?.(text) ?? false;
            onPhoneValidityChange(!!isValid);
          }}
          onChangeFormattedText={(formatted: string) => onPhoneChange(formatted)}
          withDarkTheme={theme.dark}
          withShadow={false}
          autoFocus={false}
          disabled={!isPhoneNumberEditable || disabled}
          containerStyle={styles.phoneContainer}
          textContainerStyle={styles.phoneTextContainer}
          textInputProps={{
            placeholder: 'Phone number',
            returnKeyType: 'done',
            onSubmitEditing: Keyboard.dismiss,
            blurOnSubmit: true,
            style: styles.phoneText,
          }}
        />
      </View>
      <HelperText type="error" visible={!!errors.phone} style={styles.helper}>
        {errors.phone}
      </HelperText>
    </View>
  );

  if (!wrapInCard) return <View testID={testID}>{Content}</View>;

  return (
    <Card testID={testID} style={styles.card} mode="elevated">
      <Card.Title title="Delivery details" titleVariant="titleMedium" />
      <Card.Content>{Content}</Card.Content>
    </Card>
  );
};

const SPACING = 12;
const RADIUS = 12;

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, marginBottom: SPACING },
  sectionBody: { marginTop: 4 },
  row: { flexDirection: 'row' },
  input: { marginBottom: SPACING },
  half: { flex: 1 },
  leftGap: { marginLeft: SPACING },
  helper: { marginTop: -6, marginBottom: SPACING },
  phoneWrapper: {
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  phoneContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    height: 52,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  phoneText: { fontSize: 16 },
});
