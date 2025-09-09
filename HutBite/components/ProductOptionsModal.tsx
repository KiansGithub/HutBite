import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useTheme, ActivityIndicator, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { IBaseProduct } from '@/types/product';
import { IOptionSelections } from '@/types/productOptions';
import { ProductOptions } from './ProductOptions';
import { processProductOptions } from '@/utils/productOptionsUtils';
import { useToppings } from '@/hooks/useToppings';
import { IToppingSelection, ITopping } from '@/types/toppings';
import { ProductToppings } from './ProductToppings';
import { useProductOptions } from '@/hooks/useProductOptions';
import { IBasketItem } from '@/types/basket';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import Colors from '@/constants/Colors';
import { buildImageUrl } from '@/utils/imageUtils';
import { useStore } from '@/contexts/StoreContext';
import { processToppingSelections } from '@/utils/toppingUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const lightColors = Colors.light;

interface ProductOptionsModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: IBaseProduct;
  onConfirm: (selections: {
    options: IOptionSelections;
    toppings?: IToppingSelection[];
    availableToppings?: ITopping[];
    isEditing?: boolean;
    itemId?: string;
    quantity: number;
  }) => void;
  existingItem?: IBasketItem;
  onDelete?: (itemId: string) => void;
}

export function ProductOptionsModal({
  visible,
  onDismiss,
  product,
  onConfirm,
  existingItem,
  onDelete
}: ProductOptionsModalProps) {
  const theme = useTheme();
  const { getToppingsByGroup } = useToppings();
  const { canAddToBasket, isOpen, storeMessage} = useStoreStatus();
  const { urlForImages } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(Number(existingItem?.quantity) || 1);

  const [processedOptions, setProcessedOptions] = useState<any>({ groups: [] });

  const [toppingSelections, setToppingSelections] = useState<IToppingSelection[]>([]);
  const [toppings, setToppings] = useState<ITopping[]>([]);

  const hasToppings = useMemo(
    () =>
      Boolean(product.ToppingGrpID && Array.isArray(product.Toppings) && product.Toppings.length > 0),
    [product.ToppingGrpID, product.Toppings]
  );

  const isEditing = !!existingItem;

  const { selections, validationState, filteredOptions, handleOptionSelect, loading: optionsLoading } = useProductOptions({
    options: processedOptions,
    initialSelections: existingItem?.options.reduce((acc, opt) => {
      if (opt.option_list_name !== 'Topping') {
        acc[opt.option_list_name] = opt.ref;
      }
      return acc;
    }, {} as IOptionSelections),
  });

  const { formattedPrice, currentPrice } = useRealTimePricing({
    product,
    selections,
    toppingSelections,
    availableToppings: toppings,
    quantity,
  });

  useEffect(() => {
    if (visible) {
      setQuantity(Number(existingItem?.quantity) || 1);
    } else {
      // Reset state on dismiss
      setTimeout(() => {
        setToppingSelections([]);
        setQuantity(1);
      }, 300); // Delay to allow animation to finish
    }
  }, [visible, existingItem]);

  useEffect(() => {
    if (existingItem && visible) {
      const extractedToppings: IToppingSelection[] = existingItem.options
        .filter((option) => option.option_list_name === 'Topping')
        .map((topping) => ({
          id: topping.ref.split('-').pop() || topping.ref,
          name: topping.label,
          portions: topping.quantity,
        }));
      setToppingSelections(extractedToppings);
    }
  }, [existingItem, visible]);

  useEffect(() => {
    if (visible && !existingItem && product.Toppings) {
      // Process initial toppings to respect OrgPortion values
      const initialToppingSelections = processToppingSelections(product.Toppings, toppings);
      setToppingSelections(initialToppingSelections);
    }
  }, [visible, product.Toppings, toppings, existingItem]);

  const handleDelete = () => {
    if (existingItem?.id) {
      onDelete?.(existingItem.id);
      onDismiss();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAndProcessData = async () => {
      if (!visible) return;
      setLoading(true);
      setError(null);

      try {
        // Process product options
        const opts = processProductOptions(product, product.DeGroupedPrices);
        if (isMounted) {
          setProcessedOptions(opts);
        }

        // Fetch toppings if needed
        if (product.ToppingGrpID) {
          const fetchedToppings = await getToppingsByGroup(product.ToppingGrpID);
          if (isMounted) {
            setToppings(fetchedToppings || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load product details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAndProcessData();

    return () => {
      isMounted = false;
    };
  }, [visible, product, getToppingsByGroup]);

  const handleToppingChange = useCallback((newToppings: IToppingSelection[]) => {
    setToppingSelections(newToppings);
  }, []);

  const handleConfirm = useCallback(() => {
    console.log('=== PRODUCTOPTIONSMODAL HANDLECONFIRM DEBUG ===');
    console.log('Current selections:', selections);
    console.log('Validation state:', validationState);
    console.log('Validation state isValid:', validationState.isValid);
    console.log('Validation state missingRequired:', validationState.missingRequired);
    console.log('Processed options requirements:', processedOptions.requirements);
    console.log('Processed options groups:', processedOptions.groups);
    console.log('Can add to basket:', canAddToBasket);
    console.log('Store status - isOpen:', isOpen, 'canAddToBasket:', canAddToBasket, 'storeMessage:', storeMessage);
    console.log('Is editing:', isEditing);
    console.log('Button should be enabled:', validationState.isValid && (canAddToBasket || isEditing));
    console.log('=== END PRODUCTOPTIONSMODAL DEBUG ===');
    
    if (validationState.isValid) {
      onConfirm({
        options: selections,
        toppings: toppingSelections,
        availableToppings: toppings,
        isEditing,
        itemId: existingItem?.id,
        quantity,
      });
      onDismiss();
    } else {
      console.log('Cannot confirm - validation failed:', validationState);
    }
  }, [
    validationState.isValid,
    selections,
    toppingSelections,
    toppings,
    isEditing,
    existingItem?.id,
    quantity,
    onConfirm,
    onDismiss,
    validationState,
    processedOptions,
    canAddToBasket,
    isOpen,
    storeMessage,
  ]);

  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const imageUrl = useMemo(() => {
    const imagePath = product.ImgUrl;
    return imagePath ? buildImageUrl(urlForImages, imagePath) : null;
  }, [product, urlForImages]);

  const renderContent = () => {
    if (loading || optionsLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={lightColors.primary} />
          <Text style={styles.infoText}>Loading Options...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={lightColors.primary} />
          <Text style={styles.infoText}>{error}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {processedOptions.groups.length > 0 && (
          <ProductOptions
            options={processedOptions}
            filteredOptions={filteredOptions}
            selections={selections}
            onOptionSelect={handleOptionSelect}
          />
        )}

        {hasToppings && toppings.length > 0 && (
          <ProductToppings
            toppings={toppings}
            onToppingsChange={handleToppingChange}
            initialSelections={toppingSelections}
            maxAllowedToppings={9}
          />
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDismiss}>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 250 }}>
          <ImageBackground source={{ uri: imageUrl || undefined }} style={styles.imageBackground}>
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.imageOverlay}
            />
            <SafeAreaView style={styles.header}>
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.productInfoContainer}>
              <Text style={styles.productName}>{product.Name}</Text>
              {product.Description && (
                <Text style={styles.productDescription}>{product.Description}</Text>
              )}
            </View>
          </ImageBackground>

          <View style={styles.modalContent}>{renderContent()}</View>
        </ScrollView>

        <SafeAreaView style={styles.footer}>
          <View style={styles.quantityControlContainer}>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(-1)}
                style={styles.quantityButton}
                disabled={quantity === 1}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={quantity === 1 ? lightColors.tabIconDefault : lightColors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={() => handleQuantityChange(1)} style={styles.quantityButton}>
                <Ionicons name="add" size={24} color={lightColors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.confirmButton}
              disabled={!validationState.isValid || (!canAddToBasket && !isEditing)}
            >
              <LinearGradient
                colors={
                  !validationState.isValid || (!canAddToBasket && !isEditing)
                    ? ['#AAB8C2', '#AAB8C2']
                    : [lightColors.primaryStart, lightColors.primaryEnd]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>
                  {isEditing ? `Update - ${formattedPrice}` : `Add to Cart - ${formattedPrice}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {isEditing && onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Remove from Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background, // Use solid background
  },
  modalContent: {
    // height: screenHeight * 0.9, // This will be dynamic now
    backgroundColor: lightColors.background,
    // borderTopLeftRadius: 20, // No longer needed as it's not a sheet
    // borderTopRightRadius: 20,
    // overflow: 'hidden', // Can interfere with shadows
    padding: 20,
  },
  imageBackground: {
    height: screenHeight * 0.35, // Increased height
    width: '100%',
    justifyContent: 'space-between', // Align items vertically
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align close button to the right
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 40, // Adjust for status bar
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    // padding: 20, // Moved to modalContent
    paddingBottom: 250, // Increased padding for footer and delete button
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: lightColors.background,
    marginBottom: 24,
  },
  infoText: {
    marginTop: 16,
    fontSize: 16,
    color: lightColors.tabIconDefault,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopColor: 'transparent', // Removed border
    paddingHorizontal: 20,
    paddingTop: 10, // Reduced top padding
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area for iOS bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
  },
  quantityControlContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightColors.background,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginHorizontal: 16,
  },
  footerActions: {
    width: '100%',
  },
  confirmButton: {
    width: '100%', // Full width
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButtonGradient: {
    paddingVertical: 18, // Increased padding for a taller button
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18, // Slightly larger font
    fontWeight: '600', // Semi-bold for modern look
  },
  deleteButton: {
    alignItems: 'center',
    paddingTop: 20, // Increased padding
    paddingBottom: 8, // Increased padding
  },
  deleteButtonText: {
    color: lightColors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});