import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { IconButton, Dialog, Portal, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import type { IBasketItem } from '@/types/basket';
import { parsePriceString } from '@/utils/basketUtils';
import type { BasketItemProps } from './types';
import { buildImageUrl } from '@/utils/imageUtils';
import Colors from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { Text } from '@/components/Themed';

const colors = Colors.light; 

// Format price for customer display - converts any format to £X.XX
const formatPriceForDisplay = (price: string): string => {
  // Extract just the number from any format (£8.95, 8.95 GBP, 8.95, etc.)
  const numericValue = parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
  return `£${numericValue.toFixed(2)}`;
};

export function BasketItem({
    item, 
    onQuantityChange, 
    onRemove, 
    onEdit,
    testID
}: BasketItemProps) {
    const quantity = parseInt(item.quantity, 10);
    const { currency } = useStore();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity > 0) {
            onQuantityChange(item.basketItemId, newQuantity);
        }
    };

    // Handle delete confirmation 
    const handleDeletePress = () => {
        if (quantity === 1) {
            // Direct delete when quantity is 1
            onRemove(item.basketItemId);
        } else {
            // Decrease quantity when > 1
            handleQuantityChange(-1);
        }
    };

    // Group options by type (regular options vs toppings)
    const regularOptions = item.options.filter(opt => opt.option_list_name !== 'Topping');
    const toppings = item.options.filter(opt => opt.option_list_name === 'Topping');

    const imageSource = item.imageUrl ? { uri: item.imageUrl } : null; 

    // Build succinct text for options
    const optionsText = regularOptions 
      .map((option) => option.label || 'Option')
      .join(', ');

    return (
        <View style={styles.container} testID={testID}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
                {imageSource ? (
                    <Image source={imageSource} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.placeholderImage]} />
                )}
            </View>

            {/* Product Info */}
            <View style={styles.contentContainer}>
                <View style={styles.topRow}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {item.product_name}
                        </Text>
                        {optionsText ? (
                            <Text style={styles.optionsText} numberOfLines={1}>
                                {optionsText}
                            </Text>
                        ) : null}
                    </View>
                    <Text style={styles.price}>{formatPriceForDisplay(item.price)}</Text>
                </View>

                {/* Controls Row */}
                <View style={styles.controlsRow}>
                    {/* Left side - Delete/Minus button */}
                    <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={handleDeletePress}
                        testID={`${testID}-${quantity === 1 ? 'delete' : 'decrease'}`}
                    >
                        <Ionicons 
                            name={quantity === 1 ? "trash-outline" : "remove"} 
                            size={16} 
                            color={colors.tabIconDefault} 
                        />
                    </TouchableOpacity>

                    {/* Center - Quantity */}
                    <Text style={styles.quantity}>{quantity}</Text>

                    {/* Right side - Plus button */}
                    <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={() => handleQuantityChange(1)}
                        testID={`${testID}-increase`}
                    >
                        <Ionicons name="add" size={16} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border + '30',
    },
    imageContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: colors.tabIconDefault + '20',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    productInfo: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    optionsText: {
        fontSize: 13,
        color: colors.tabIconDefault,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    controlButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantity: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
});