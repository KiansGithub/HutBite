import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { Modal, Portal, useTheme, ActivityIndicator, HelperText, IconButton, Card, Button } from 'react-native-paper';
import { IBaseProduct } from '@/types/product';
import { IOptionSelections, IProcessedProductOptions } from '@/types/productOptions';
import { ProductOptions } from './ProductOptions';
import { Text } from '@/components/Themed';
import { processProductOptions } from '@/utils/productOptionsUtils';
import { useToppings } from '@/hooks/useToppings';
import { IToppingSelection, ITopping } from '@/types/toppings';
import { ProductToppings } from './ProductToppings';
import { useProductOptions } from '@/hooks/useProductOptions';
import { IBasketItem } from '@/types/basket';
import { useBasketContext } from '@/context/BasketContext';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';
import { useStoreStatus } from '@/hooks/useStoreStatus';

interface RestaurantProductOptionsModalProps {
    visible: boolean; 
    onDismiss: () => void; 
    product: IBaseProduct; 
    onConfirm: (selections: { 
        options: IOptionSelections;
        toppings?: IToppingSelection[];  
        availableToppings?: ITopping[];
        isEditing?: boolean; 
        itemId?: string; 
        quantity?: number; 
    }) => void; 
    imageSource?: ImageSourcePropType;
    existingItem?: IBasketItem; 
    onDelete?: (itemId: string) => void; 
}

export function RestaurantProductOptionsModal({
    visible, 
    onDismiss, 
    product, 
    onConfirm,
    imageSource,
    existingItem, 
    onDelete
}: RestaurantProductOptionsModalProps) {
    const theme = useTheme();
    const { getToppingsByGroup } = useToppings();
    const { canAddToBasket } = useStoreStatus();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const colors = theme.colors;

    const [processedOptions, setProcessedOptions] = useState<IProcessedProductOptions>({
        groups: [],
        requirements: { mandatoryKeys: [] },
        validCombinations: {}
    });

    const initialSelections = useMemo(() => ({}), []);
    const [toppingSelections, setToppingSelections] = useState<IToppingSelection[]>([]);
    const [toppings, setToppings] = useState<ITopping[]>([]);
    const [quantity, setQuantity] = useState(1);

    const hasToppings = useMemo(() => (
        Boolean(product.ToppingGrpID && Array.isArray(product.Toppings) && product.Toppings.length > 0)
    ), [product.ToppingGrpID, product.Toppings]);

    const isEditing = !!existingItem;

    const {
        selections, 
        validationState, 
        filteredOptions, 
        handleOptionSelect, 
        handleOptionChange, 
        loading: optionsLoading 
    } = useProductOptions({ options: processedOptions });

    const { formattedPrice, currentPrice } = useRealTimePricing({
        product, 
        selections, 
        toppingSelections, 
        availableToppings: toppings
    });

    useEffect(() => {
        if (!visible) {
            setToppingSelections([]);
            setQuantity(1);
        }
    }, [visible]);

    useEffect(() => {
        if (existingItem && visible) {
            const extractedOptions: IOptionSelections = {};
            
            existingItem.options.forEach(option => {
                if (option.option_list_name !== 'Topping') {
                    extractedOptions[option.option_list_name] = option.ref;
                }
            });

            Object.entries(extractedOptions).forEach(([key, value]) => {
                if (value !== null) {
                    handleOptionSelect(key, value);
                }
            });

            const extractedToppings: IToppingSelection[] = existingItem.options
              .filter(option => option.option_list_name === 'Topping')
              .map(topping => ({
                id: topping.ref.split('-').pop() || topping.ref,
                name: topping.label, 
                portions: topping.quantity
              }));

            if (extractedToppings.length > 0) {
                setToppingSelections(extractedToppings);
            }
            
            if (existingItem.quantity) {
                setQuantity(existingItem.quantity);
            }
        }
    }, [existingItem, visible, handleOptionSelect]);

    const handleDelete = () => {
        if (existingItem?.id) {
            onDelete?.(existingItem.id);
        }
    };

    useEffect(() => {
        let isMounted = true; 

        const fetchToppings = async () => {
            if (product.ToppingGrpID) {
                try {
                    const fetchedToppings = await getToppingsByGroup(product.ToppingGrpID);
                    if (isMounted) {
                        setToppings(fetchedToppings || []);
                    }
                } catch (err) {
                    console.error("Error fetching toppings:", err);
                }
            }
            if (isMounted) setLoading(false);
        };

        fetchToppings();

        return () => {
            isMounted = false;
        };
    }, [product.ToppingGrpID, getToppingsByGroup]);

    useEffect(() => {
        let mounted = true;

        if (visible) {
            setLoading(true);
            setError(null);

            try {
                const opts = processProductOptions(product, product.DeGroupedPrices);
                if (mounted) {
                    setProcessedOptions(opts);
                }
            } catch (err) {
                if (mounted) {
                    setError('Failed to process product options');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }
        return () => {
            mounted = false;
        };
    }, [visible, product, product.DeGroupedPrices]);

    const handleToppingChange = useCallback((newToppings: IToppingSelection[]) => {
        setToppingSelections(newToppings);
    }, []);

    const handleQuantityChange = useCallback((newQuantity: number) => {
        setQuantity(Math.max(1, newQuantity));
    }, []);

    const handleConfirm = useCallback(() => {
        console.log("Confirming product with selections: ", {
            options: selections, 
            toppings: toppingSelections,
            isEditing,
            itemId: existingItem?.id,
            quantity
        });

        if (validationState.isValid) {
            onConfirm({
                options: selections,
                toppings: toppingSelections,
                availableToppings: toppings,
                isEditing, 
                itemId: existingItem?.id,
                quantity
            });

            setTimeout(() => {
                setToppingSelections([]);
                setQuantity(1);
            }, 0);

            onDismiss();
        }
    }, [
        validationState.isValid,
        selections,
        toppingSelections,
        quantity,
        isEditing, 
        existingItem, 
        onConfirm,
        onDismiss,
        toppings
    ]);

    return (
        <Portal>
            <Modal 
                testID="product-options-modal"
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modal, 
                    { backgroundColor: theme.colors.background, paddingBottom: 0, margin: 0 }
                ]}
            >
                <View style={styles.headerRow}>
                    {imageSource && (
                        <Card.Cover
                            source={imageSource}
                            style={styles.headerImage}
                        />
                    )}
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{product.Name}</Text>
                        {product.Description && (
                            <Text style={styles.description}>{product.Description}</Text>
                        )}
                    </View>
                    <IconButton icon="close" onPress={onDismiss} style={styles.closeButton} />
                </View>

                <View style={[styles.contentWrapper, { backgroundColor: colors.surface }]}>
                    {(loading || optionsLoading) && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <HelperText type="error" style={styles.errorText}>{error}</HelperText>
                        </View>
                    )}

                    {!loading && !optionsLoading && !error && (
                        <ScrollView 
                            style={[styles.scrollContainer, { backgroundColor: colors.background }]}
                            contentContainerStyle={[styles.scrollContent]}
                        >
                            {processedOptions.groups.length > 0 && (
                                <ProductOptions 
                                    options={processedOptions}
                                    filteredOptions={filteredOptions}
                                    selections={selections}
                                    onOptionSelect={handleOptionSelect}
                                    onOptionChange={handleOptionChange}
                                />
                            )}

                            {hasToppings && toppings.length > 0 && (
                                <ProductToppings 
                                    toppings={toppings}
                                    onToppingsChange={handleToppingChange}
                                    initialToppings={product.Toppings || []}
                                    maxAllowedToppings={9}
                                />
                            )}
                        </ScrollView>
                    )}
                </View>

                <View style={[styles.footer, { backgroundColor: colors.background }]}>
                    <View style={styles.quantityControls}>
                        <IconButton
                            icon="minus"
                            size={20}
                            onPress={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                            style={[styles.quantityButton, { backgroundColor: colors.primary }]}
                            iconColor="#fff"
                        />
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <IconButton
                            icon="plus"
                            size={20}
                            onPress={() => handleQuantityChange(quantity + 1)}
                            style={[styles.quantityButton, { backgroundColor: colors.primary }]}
                            iconColor="#fff"
                        />
                    </View>

                    <Button 
                        onPress={handleConfirm}
                        style={[
                            styles.footerButton,
                            !validationState.isValid && styles.disabledButton
                        ]}
                        testID="confirm-button"
                        disabled={(!canAddToBasket && !isEditing) || !validationState.isValid}
                    >
                        {isEditing ? 'Update Item' : `Add To Cart - ${formattedPrice}`}
                    </Button>

                    {isEditing && onDelete && (
                        <Button 
                            onPress={handleDelete}
                            style={[styles.footerButton, styles.deleteButton]}
                            testID="delete-button"
                        >
                            Delete Item
                        </Button>
                    )}
                </View>
            </Modal>
        </Portal>
    )
}

const styles = StyleSheet.create({
    modal: {
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#e0e0e0',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    headerImage: {
        width: 80, 
        height: 80, 
        resizeMode: 'cover',
        borderRadius: 8,
    },
    headerContent: {
        flex: 1, 
        marginLeft: 16,
    },
    title: {
        fontWeight: '600',
        fontSize: 16, 
        marginBottom: 4, 
    },
    description: {
        color: '#666',
        fontSize: 14, 
        lineHeight: 18,
    },
    closeButton: {
        margin: 0,
    },
    contentWrapper: {
        flexShrink: 1,
    },
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorContainer: {
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    scrollContent: { 
        paddingHorizontal: 16, 
        paddingBottom: 8, 
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 24, 
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        margin: 0,
    },
    quantityText: {
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 16,
        minWidth: 30,
        textAlign: 'center',
    },
    footerButton: {
        flex: 1,
        minWidth: 120, 
    },
    disabledButton: {
        opacity: 0.6,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        marginLeft: 8,
        flex: 0,
        minWidth: 100, 
    }
});
