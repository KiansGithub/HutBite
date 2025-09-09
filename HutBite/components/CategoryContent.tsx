import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text, useTheme } from 'react-native-paper';
import { IBaseProduct } from '@/types/product';
import { ProductList } from './ProductList';
import { ThemedView } from './ThemedView';
import { MenuGroup } from '@/types/store';
import { filterVisibleProducts } from '@/utils/menuFilter';
import { Colors } from '@/constants/Colors';
import { translate } from '@/constants/translations';

const colors = Colors.light; 

interface CategoryContentProps {
    loading?: boolean; 
    error?: string | null; 
    onRetry?: () => void; 
    groups: MenuGroup[];
    selectedGroupId: string | null;
    onProductPress?: (productId: string) => void;
}

export function CategoryContent({
    loading = false, 
    error = null, 
    onRetry,
    groups = [],
    selectedGroupId, 
    onProductPress
}: CategoryContentProps) {

    const filteredProducts = useMemo(() => {
        const selectedGroup = groups.find(group => group.ID === selectedGroupId);
        const products = selectedGroup?.DeProducts || [];
        return filterVisibleProducts(products);
    }, [groups, selectedGroupId])

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <ActivityIndicator 
                      animating 
                      size="large"
                      color={colors.primary}
                    />
                    <Text 
                      style={[styles.loadingText, { color: colors.text }]}
                    >
                        Loading content...
                    </Text>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            {error ? (
                <Snackbar 
                  visible={!!error}
                  onDismiss={() => {}}
                  action={{
                    label: translate('retry'),
                    onPress: onRetry,
                  }}
                  style={[styles.snackbar, { backgroundColor: colors.error || '#b00020' }]}
                >
                    {error || translate('errorOccurred')}
                </Snackbar>
            ) : (
                <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
                    {filteredProducts.length === 0 ? (
                        <Text style={[styles.placeholderText, { color: colors.text }]}>
                            {selectedGroupId ? translate('noProductsAvailable') : translate('selectCategory')}
                        </Text>
                    ) : (
                        <ProductList products={filteredProducts} onProductPress={onProductPress} />
                    )}
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        padding: 16, 
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 24, 
    },
    loadingText: {
        marginTop: 16, 
        fontSize: 16,
    },
    placeholderText: {
        fontSize: 18, 
        textAlign: 'center',
        opacity: 0.7,
    },
    snackbar: {
        borderRadius: 4,
    }
});