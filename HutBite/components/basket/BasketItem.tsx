import React, { useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Card, IconButton, Dialog, Portal, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { IBasketItem } from '@/types/basket';
import { parsePriceString } from '@/utils/basketUtils';
import type { BasketItemProps } from './types';
import { buildImageUrl } from '@/utils/imageUtils';
import  Colors from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { Text } from '@/components/Themed';

const colors = Colors.light; 

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
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onRemove(item.basketItemId);

        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    // Group options by type (regular options vs toppings)
    const regularOptions = item.options.filter(opt => opt.option_list_name !== 'Topping');
    const toppings = item.options.filter(opt => opt.option_list_name === 'Topping');

    // Format price for the display 
    const formatPrice = (price: string) => {
        const priceValue = parsePriceString(price);
        if (priceValue === 0) {
            return '';
        }
        return price; 
    }
    const hasOptions = regularOptions.length > 0 || toppings.length > 0; 

    const imageSource = item.imageUrl ? { uri: item.imageUrl } : null; 

    // Build succinct text for regular options and toppings 
    const regularOptionsText = regularOptions 
      .map((option) => {
        const entries = option.label 
          ? option.label.split(', ').map((entry) => entry.trim())
          : ['Unknown Option'];
        return entries 
          .map(
            (entry) => 
                `${entry}${
                    formatPrice(option.price) && option.quantity > 1 
                      ? ` x${option.quantity}`
                      : ''
                }`
          )
          .join(', ')
      })
      .join(' ');

    const toppingsText = toppings
      .map(
        (topping) => 
            `${topping.label || 'Topping'}${
                topping.quantity > 1 ? ` x${topping.quantity}` : ''
            }`
      )
      .join(', ');

    return (
        <>
        <Card style={[styles.card, { backgroundColor: colors.background }]} testID={testID}>
            <LinearGradient
                colors={[colors.primary, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccent}
                pointerEvents="none"
            />
            <View style={styles.container}>
            <View style={styles.topRow}>
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    {imageSource ? (
                        <Image source={imageSource} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage]} />
                    )}
                </View>
           
            {/* Product Details */}
            <View style={styles.textContainer}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                {regularOptionsText ? (
                    <Text style={styles.optionsText} numberOfLines={2}>
                        {regularOptionsText}
                    </Text>
                ): null}
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.price}>
                    {item.price}
                </Text>
            </View>
            </View>

            {toppingsText ? (
                <View style={styles.toppingsRow}>
                    <IconButton 
                      icon="plus"
                      size={14}
                      style={styles.toppingsIcon}
                      disabled 
                    />
                    <Text style={styles.toppingsRowText} numberOfLines={3}>
                        {toppingsText}
                    </Text>
                    </View>
            ): null}

            <View style={styles.bottomRow}>
                {/* <View style={styles.actionButtons}>
                    <IconButton 
                        icon="pencil"
                        size={20}
                        onPress={() => onEdit?.(item)}
                        testID={`${testID}-edit`}
                    />
                </View> */}
                {/* Delete button */}
                <IconButton 
                    icon="delete"
                    size={20}
                    onPress={handleDeletePress}
                    testID={`${testID}-delete`}
                    style={[{}]}
                />

                <View style={styles.quantityControls}>
                    <IconButton 
                        icon="minus"
                        size={20}
                        onPress={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        testID={`${testID}-decrease`}
                    />
                    <Text style={styles.quantity}>{quantity}</Text>
                    <IconButton 
                        icon="plus"
                        size={20}
                        onPress={() => handleQuantityChange(1)}
                        testID={`${testID}-increase`}
                    />
                </View>
            </View>
            </View>
            </Card>

            {/* Delete confirmation dialog */}
            <Portal>
                <Dialog 
                    visible={showDeleteConfirm}
                    onDismiss={handleCancelDelete} 
                    style={{borderRadius: 0}}
                    testID={`${testID}-delete-dialog`}
                >
                    <Dialog.Title>Remove Item</Dialog.Title>
                    <Dialog.Content>
                        <Text>
                            Are you sure you want to remove {item.product_name} from your basket?
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button 
                            onPress={handleCancelDelete}
                            testID={`${testID}-cancel-delete`}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onPress={handleConfirmDelete}
                            testID={`${testID}-confirm-delete`}
                        >
                            Remove
                        </Button>
                        
                    </Dialog.Actions>
                </Dialog>
                </Portal>
                </>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    card: {
        marginVertical: 6,
        marginHorizontal: 6,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12, 
        maxWidth: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageContainer: {
        width: 100, 
        height: 100,
        overflow: 'hidden',
        borderTopLeftRadius: 16, 
        borderBottomLeftRadius: 16, 
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: colors.background,
    },
    textContainer: {
        flex: 1, 
        marginLeft: 12, 
        justifyContent: 'flex-start',
    },
    priceContainer: {
        minWidth: 60, 
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        paddingRight: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600', 
    },
    optionLabel: {
        flex: 1,
    },
    price: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginVertical: 4,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    optionQuantity: {
        fontWeight: '500',
    },
    controls: {
        marginTop: 16, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    quantity: {
        marginHorizontal: 8,
        fontSize: 16,
    },
    optionsContainer: {
        backgroundColor: colors.background,
        padding: 6,
        borderRadius: 8,
        marginVertical: 4, 
    },
    optionsText: {
        fontSize: 14,
        color: colors.text,
        marginTop: 4, 
    },
    toppingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8, 
        marginBottom: 2
    },
    toppingsIcon: {
        marginRight: 4, 
    },
    toppingsRowText: {
        fontSize: 12, 
        color: colors.text,
    },
    bottomRow: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toppingsText: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 4,
    },
    cardAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6, 
    },
});