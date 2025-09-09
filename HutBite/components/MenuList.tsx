import React, { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, Text, TouchableRipple } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuCategory } from '@/types/store';
import { getGroupsByCategory } from '@/services/api';
import { useStore } from '@/store/StoreContext';
import { theme } from '../constants/theme';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

// Props type definition
interface MenuListProps {
    categories: MenuCategory[];
    onCategoryPress?: (categoryId: string) => void;
}

export function MenuList({ categories, onCategoryPress }: MenuListProps) {
    const [loadingCategoryId, setLoadingCategoryId] = useState<string | null>(null);
    const { stripeStoreUrl, nearestStoreId, setStoreState } = useStore();

    const handlePress = useCallback(
        async (categoryId: string) => {
            setLoadingCategoryId(categoryId);

            try {
                const groups = await getGroupsByCategory(
                    stripeStoreUrl,
                    nearestStoreId,
                    categoryId
                );
                setStoreState(prev => ({
                    ...prev, 
                    groups, 
                    selectedGroupId: groups.length > 0 ? groups[0].ID : null,
                    selectCategoryId: categoryId
                }));

                // Call the onCategoryPress callback if provided 
                if (onCategoryPress) {
                    onCategoryPress(categoryId);
                }
                // Navigate to category detail page 
                router.push(`/category/${categoryId}`);
            } catch (error) {
                console.error('Error loading groups:', error);
            } finally {
                setLoadingCategoryId(null);
            }
        },
        [onCategoryPress, stripeStoreUrl, nearestStoreId, setStoreState]
    );

    // Filter categories to include only those where DisplayAble is true 
    const filteredCategories = categories.filter((category) => 
            category.DisplyAble &&
            category.Name !== '121order' &&
            category.Name !== 'PayWay'
        );

    if (!filteredCategories || filteredCategories.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: 'transparent'}]}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No categories available</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.ID}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.container, {backgroundColor: 'transparent'}]}
            renderItem={({ item }) => (
                <TouchableRipple
                    borderless
                    style={[styles.categoryItem, { backgroundColor: 'transparent'}]}
                    onPress={() => handlePress(item.ID)}
                    rippleColor="transparent"
                    underlayColor="transparent"
                >
                    <Card style={[styles.card]}>
                        <View style={[styles.labelContainer]}>
                            <Text style={[styles.categoryName]}>{item.Name.toUpperCase()}</Text>
                            {loadingCategoryId === item.ID && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                        <LinearGradient
                            colors={[colors.primary, colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardAccent}
                            pointerEvents="none"
                        />
                    </Card>
                </TouchableRipple>

            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 60,
        backgroundColor: colors.background,
    },
    cardAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
    },
    listItem: {
        backgroundColor: theme.colors.surface, 
        borderRadius: 8, 
        marginVertical: 8,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20, 
        marginVertical: 12,
        elevation: 4,
        height: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    categoryItem: {
        borderRadius: 8,
    },
    labelContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 7, 
        borderRadius: 8
    },
    categoryName: {
        fontSize: 22,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
