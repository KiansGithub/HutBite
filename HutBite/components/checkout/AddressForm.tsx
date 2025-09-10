import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Keyboard, Text } from 'react-native';
import { TextInput, useTheme, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import RNPhoneInput from 'react-native-phone-number-input';
import { parsePhoneNumber } from 'awesome-phonenumber';

const PhoneInput = RNPhoneInput as unknown as React.ComponentType<any>;

interface AddressFormProps {
   address: string;
   city: string;
   postalCode: string;
   instructions: string;
   phone: string;
   errors: {
       address?: string;
       city?: string;
       postalCode?: string;
       phone?: string;
   };
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
   /**
    * When true the form will be wrapped inside a Card. This is the default
    * behaviour used on the checkout screen. It can be disabled for screens
    * that already place the form inside another Card.
    */
   wrapInCard?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> =({
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
   disabled=false,
   isPhoneNumberEditable = true,
   testID = 'address-form',
   wrapInCard = true,
}) => {
   const theme = useTheme();
   const phoneInput = useRef<any>(null);

   const pn = parsePhoneNumber(phone, { regionCode: 'DE' });
   const countryCode = (pn.valid && pn.regionCode ? pn.regionCode.toUpperCase() : 'DE') as any;
   const nationalNumber = pn.valid ? pn.number.national : phone; 




   // Handle address selection from autocomplete
   const handleAddressSelected = useCallback(
    (addr: string, c: string, pc: string) => {
        onAddressChange(addr);
        onCityChange(c);

        onPostalCodeChange(pc);

    },
    [onAddressChange, onCityChange, onPostalCodeChange ]
   );

   if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
   }

   const formContent = (
     <>
       <TextInput
         dense
         mode="outlined"
         placeholder="Street Address"
         value={address}
         onChangeText={onAddressChange}
         style={styles.input}
         disabled={disabled}
         error={!!errors.address}
         testID="street-address-input"
         left={<TextInput.Icon icon={() => <MaterialIcons name="home" size={20} color={theme.colors.primary} />} />}
       />
       {errors.address && (
         <Text style={styles.errorText}>{errors.address}</Text>
       )}

       <View style={styles.row}>
         <TextInput
           dense
           mode="outlined"
           placeholder="City"
           value={city}
           onChangeText={onCityChange}
           style={[styles.input, styles.halfInput]}
           disabled={disabled}
           error={!!errors.city}
           testID="city-input"
           left={<TextInput.Icon icon={() => <MaterialIcons name="location-city" size={20} color={theme.colors.primary} />} />}
         />

         <TextInput
           dense
           mode="outlined"
           placeholder="Postal Code"
           value={postalCode}
           onChangeText={onPostalCodeChange}
           style={[styles.input, styles.halfInput, styles.postCodeInput]}
           error={!!errors.postalCode}
           testID="postal-code-input"
           editable={!(address && city && postalCode)}
           disabled
           left={<TextInput.Icon icon={() => <MaterialIcons name="mail" size={20} color={theme.colors.primary} />} />}
         />
       </View>
       {errors.postalCode && (
         <Text style={styles.errorText}>{errors.postalCode}</Text>
       )}

       <TextInput
         dense
         mode="outlined"
         placeholder="Delivery Instructions"
         value={instructions}
         onChangeText={onInstructionsChange}
         style={styles.input}
         disabled={disabled}
         multiline
         numberOfLines={3}
         contentStyle={styles.instructionsContent}
         testID="instructions-input"
         blurOnSubmit 
         onSubmitEditing={() => Keyboard.dismiss()}
         onKeyPress={(e) => {
          // Android multiline still inserts a newline. Intercept it:
          if (e.nativeEvent.key === 'Enter') {
            e.preventDefault?.(); // RN 0.73+; safe to guard
            Keyboard.dismiss();
          }
        }}
         left={<TextInput.Icon icon={() => <MaterialIcons name="notes" size={20} color={theme.colors.primary} />} />}
       />

        <PhoneInput
        ref={phoneInput}
        value={nationalNumber}
        defaultCode={countryCode}
        layout="first"
        onChangeText={(text: string) => {
          const checkValid = phoneInput.current?.isValidNumber(text);
          onPhoneValidityChange(checkValid ?? false);
        }}
        onChangeFormattedText={(text: string) => {
          console.log('Formatted phone number:', text);
          onPhoneChange(text);
            // The component now receives the unformatted number and formats it internally
        }}
        withDarkTheme={theme.dark}
        withShadow
        autoFocus={false}
        disabled={!isPhoneNumberEditable}
        containerStyle={[styles.input, { width: '100%', backgroundColor: theme.colors.surface, height: 50 }]}
        textContainerStyle={{ paddingVertical: 0, backgroundColor: theme.colors.surface  }}
        textInputProps={{ 
          placeholder: 'Phone Number',
          placeholderTextColor: theme.colors.onSurfaceVariant,
          style: { color: theme.colors.onSurface, fontSize: 16 },
          returnKeyType: 'done',
          onSubmitEditing: () => Keyboard.dismiss(),
          blurOnSubmit: true,
        }}
      />
      {errors.phone && (
        <Text style={styles.errorText}>{errors.phone}</Text>
      )}

     </>
   );

   return (
     <View style={[styles.container, { backgroundColor: theme.colors.surface }]} testID={testID}>
       {wrapInCard ? (
         <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
           <Card.Content>{formContent}</Card.Content>
         </Card>
       ) : (
         formContent
       )}
     </View>
   );
};

const styles = StyleSheet.create({
   container: { marginBottom: 0 },
   sectionTitle: { marginBottom: 12 },
   card: { borderRadius: 12 },
   loadingContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
   row: { flexDirection: 'row' },
   input: { marginBottom: 12, fontSize: 14 },
   halfInput: { flex: 1 },
   postCodeInput: { marginLeft: 8 },
   errorText: { color: 'red', marginBottom: 8, marginTop: -8 },
   instructionsContent: {
    textAlignVertical: 'center',  // Android centres placeholder & text
    paddingVertical: 8,           // balanced look, works on iOS too
  },
});