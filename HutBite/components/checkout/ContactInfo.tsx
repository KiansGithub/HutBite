import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { TextInput, useTheme, Card } from 'react-native-paper';
import { useCustomerContext } from '@/context/CustomerContext';
import { ThemedText } from '@/components/ThemedText';
import { translate } from '@/constants/translations';

interface ContactInfoProps {
    firstName: string; 
    lastName: string; 
    email: string; 
    errors: {
        firstName?: string; 
        lastName?: string;
        email?: string; 
    };
    onFirstNameChange: (text: string) => void;
    onLastNameChange: (text: string) => void;
    isLoading?: boolean; 
    onEmailChange: (text: string) => void; 
    testID?: string; 
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
    firstName, 
    lastName, 
    email, 
    errors, 
    onFirstNameChange, 
    onLastNameChange, 
    isLoading = false,
    onEmailChange, 
    testID = 'contact-info',
}) => {
    const theme = useTheme();
    return (
        isLoading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        :
        <View style={[styles.container, { backgroundColor: theme.colors.surface}]} testID={testID}>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface}]} elevation={2}>
                <Card.Content>

            <TextInput 
              dense
              mode="outlined"
              placeholder={translate('firstName')}
              value={firstName}
              onChangeText={onFirstNameChange}
              style={styles.input}
              error={!!errors.firstName}
              testID="first-name-input"
            />
            {errors.firstName && (
                <ThemedText style={styles.errorText} testID="first-name-error">
                    {errors.firstName}
                </ThemedText>
            )}

            <TextInput 
              dense
              mode="outlined"
              placeholder={translate('lastName')}
              value={lastName}
              onChangeText={onLastNameChange}
              style={styles.input}
              error={!!errors.lastName}
              testID="last-name-input"
            />
            {errors.lastName && (
                <ThemedText style={styles.errorText} testID="last-name-error">
                    {errors.lastName}
                </ThemedText>
            )}

            <TextInput 
              dense
              mode="outlined"
              placeholder={translate('email')}
              value={email}
              onChangeText={onEmailChange}
              style={styles.input}
              keyboardType="email-address"
              error={!!errors.email}
              testID="email-input"
              autoCapitalize="none"
            />
            {errors.email && (
                <ThemedText style={styles.errorText} testID="email-error">
                    {errors.email}
                </ThemedText>
            )}
            </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    sectionTitle: { marginBottom: 12 },
    card: {
        borderRadius: 12, 
    },
    loadingContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    input: { marginBottom: 12, fontSize: 14 },
    errorText: { color: 'red', marginBottom: 8, marginTop: -8 },
})