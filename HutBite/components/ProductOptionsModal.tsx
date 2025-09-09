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
  onDelete,
}: ProductOptionsModalProps) {
  const theme = useTheme();
  const { getToppingsByGroup } = useToppings();
  const { canAddToBasket } = useStoreStatus();
  const { urlForImages } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);

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
      setQuantity(existingItem?.quantity || 1);
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
        console.error('Error processing product data:', err);
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
  ]);

  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const imageUrl = useMemo(() => {
    const imagePath = product.ImgUrl || product.ImageUrl || product.ImageURL;
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
        <Text style={styles.productName}>{product.Name}</Text>
        {product.Description && <Text style={styles.productDescription}>{product.Description}</Text>}

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
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
      <View style={styles.container}>
        <ImageBackground source={{ uri: imageUrl }} style={styles.imageBackground}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.contentSheet}>{renderContent()}</View>

        <SafeAreaView style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={() => handleQuantityChange(-1)} style={styles.quantityButton}>
                <Ionicons name="remove" size={24} color={lightColors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={() => handleQuantityChange(1)} style={styles.quantityButton}>
                <Ionicons name="add" size={24} color={lightColors.primary} />
              </TouchableOpacity>
            </View>

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
          </View>
          {isEditing && onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Remove from Cart</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  imageBackground: {
    height: screenHeight * 0.35,
    width: '100%',
    justifyContent: 'flex-start',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: lightColors.background,
    marginTop: -20, // Pulls the sheet up over the image
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 150, // Space for the footer
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    marginTop: 16,
    fontSize: 16,
    color: lightColors.tabIconDefault,
    textAlign: 'center',
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: lightColors.tabIconDefault,
    marginBottom: 24,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16, // Handles notch
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightColors.card,
    borderRadius: 30,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginHorizontal: 12,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 30,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: lightColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});