// components/checkout/ContactInfo.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, HelperText, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface ContactInfoProps {
  firstName: string;
  lastName: string;
  email: string;
  errors: { firstName?: string; lastName?: string; email?: string };
  onFirstNameChange: (t: string) => void;
  onLastNameChange: (t: string) => void;
  onEmailChange: (t: string) => void;
  disabled?: boolean;
  wrapInCard?: boolean;
  testID?: string;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
  firstName,
  lastName,
  email,
  errors,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  disabled = false,
  wrapInCard = true,
  testID = 'contact-info',
}) => {
  const theme = useTheme();

  const Content = (
    <View style={styles.sectionBody}>
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          label="First name"
          value={firstName}
          onChangeText={onFirstNameChange}
          style={[styles.input, styles.half]}
          disabled={disabled}
          error={!!errors.firstName}
          left={<TextInput.Icon icon={() => <MaterialIcons name="person" size={20} color={theme.colors.primary} />} />}
        />
        <TextInput
          mode="outlined"
          label="Last name"
          value={lastName}
          onChangeText={onLastNameChange}
          style={[styles.input, styles.half, styles.leftGap]}
          disabled={disabled}
          error={!!errors.lastName}
          left={<TextInput.Icon icon={() => <MaterialIcons name="person-outline" size={20} color={theme.colors.primary} />} />}
        />
      </View>
      <HelperText type="error" visible={!!errors.firstName || !!errors.lastName} style={styles.helper}>
        {errors.firstName || errors.lastName}
      </HelperText>

      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        disabled={disabled}
        error={!!errors.email}
        left={<TextInput.Icon icon={() => <MaterialIcons name="mail-outline" size={20} color={theme.colors.primary} />} />}
      />
      <HelperText type="error" visible={!!errors.email} style={styles.helper}>
        {errors.email}
      </HelperText>
    </View>
  );

  if (!wrapInCard) return <View testID={testID}>{Content}</View>;

  return (
    <Card testID={testID} style={styles.card} mode="elevated">
      <Card.Title title="Contact details" titleVariant="titleMedium" />
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
});
