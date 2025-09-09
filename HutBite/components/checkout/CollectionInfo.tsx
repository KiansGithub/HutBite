import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { translate } from '@/constants/translations';
import { MaterialIcons } from '@expo/vector-icons';

interface StoreInfo {
    name: string; 
    address: string; 
    openingHours?: string; 
    phone?: string; 
}

interface CollectionInfoProps {
    storeInfo: StoreInfo; 
    testID?: string; 
}

export const CollectionInfo: React.FC<CollectionInfoProps> = ({
    storeInfo, 
    testID = 'collection-info',
}) => {
    const theme = useTheme();

    const InfoRow = ({ icon, text, testID }: { icon: string; text: string; testID?: string }) => (
        <View style={styles.infoRow}>
            <MaterialIcons name={icon as any} size={20} color={theme.colors.primary} style={styles.icon} />
            <ThemedText style={styles.infoText} testID={testID}>{text}</ThemedText>
        </View>
    );
    return (
    <View style={styles.container} testID={testID}>

        <Card style={[styles.storeInfoCard, { backgroundColor: theme.colors.surface}]} testID="store-info-card">
            <Card.Content>
                {storeInfo.name && (
                    <InfoRow icon="storefront" text={storeInfo.name} testID="store-name" />
                )}

                {storeInfo.address && (
                    <InfoRow icon="location-on" text={storeInfo.address} testID="store-address" />
                )}

                {storeInfo.openingHours && (
                    <InfoRow icon="access-time" text={storeInfo.openingHours} testID="store-hours" />
                )}

                {storeInfo.phone && (
                    <InfoRow icon="call" text={storeInfo.phone} testID="store-phone" />
                )}
            </Card.Content>
        </Card>
    </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    sectionTitle: { marginBottom: 12 },
    storeInfoCard: { marginTop: 8, borderRadius: 12 },
    infoRow: { marginTop: 8 },
    icon: {
        marginRight: 10
    },
    infoText: {
        fontSize: 16,
        flexShrink: 1,
    },

})