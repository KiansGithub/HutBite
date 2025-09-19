import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Snackbar, Surface, Text, useTheme, Banner } from 'react-native-paper';
import { MenuList } from './MenuList';
import { useStore } from '@/store/StoreContext';
import { getMenuCategories } from '@/services/apiService';
import { Colors } from '@/constants/Colors';
import { translate } from '@/constants/translations';
import { isStoreOpen, getStoreHoursMessage } from '@/utils/storeUtils';

const colors = Colors.light;

export function Menu() {
    const { stripeStoreUrl, nearestStoreId, categories, setStoreState, storeInfo } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    

    const { colors: themeColors } = useTheme();

    const isOpen = storeInfo ? isStoreOpen(storeInfo) : true;
    const storeMessage = storeInfo ? getStoreHoursMessage(storeInfo) : '';

    useEffect(() => {
        const fetchCategories = async () => {
            if (categories.length > 0 || !stripeStoreUrl || !nearestStoreId) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { categories: fetchedCategories, optionCatId, toppingCatId } = await getMenuCategories(stripeStoreUrl, nearestStoreId);

                console.log('catType', fetchedCategories);
                console.log('optionCategoryId', optionCatId);
                console.log('toppingCategoryId', toppingCatId);

                if (fetchedCategories.length === 0) {
                    throw new Error('No menu categories available.');
                }

                setStoreState((prev) => ({
                    ...prev,
                    categories: fetchedCategories,
                    optionCategoryId: optionCatId,
                }));
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : translate('failedToLoadOptions')
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [stripeStoreUrl, nearestStoreId, categories.length, setStoreState]);

    return (
        <Surface mode="flat" elevation={0} style={[styles.container, { backgroundColor: 'transparent' }]}>
            {!isOpen && (
                <Banner
                    visible={true}
                    actions={[]}
                    icon="clock-outline"
                    style={styles.closedBanner}
                >
                    <Text style={styles.closedBannerText}>
                        {translate('storeClosed')} - {storeMessage}
                        {'\n'}{translate('browseMenuOnly')}
                    </Text>
                </Banner>
            )}
            {loading && (
                <View style={styles.centerContent}>
                    <ActivityIndicator animating size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Loading menu...</Text>
                </View>
            )}

            {!loading && error && (
                <Snackbar
                    visible={!!error}
                    onDismiss={() => setError(null)}
                    action={{
                        label: 'Retry',
                        onPress: () => setError(null),
                    }}
                    style={{ backgroundColor: colors.error }}
                >
                    {error}
                </Snackbar>
            )}

            {!loading && !error && categories.length > 0 && (
                <View style={styles.listWrapper}>
                <MenuList categories={categories} />
                </View>
            )}

            {!loading && !error && categories.length === 0 && (
                <View style={styles.centerContent}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>No menu categories available.</Text>
                </View>
            )}
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        margin: 8,
    },
    closedBanner: {
        backgroundColor: colors.error,
        marginBottom: 16,
        borderRadius: 8,
    },
    closedBannerText: {
        color: 'white',
        fontWeight: '500',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 26, 
        backgroundColor: colors.background,
    },
    listWrapper: {
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 8,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 18,
        color: colors.muted,
        textAlign: 'center',
    },
});
