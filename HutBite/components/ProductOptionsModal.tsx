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

interface ProductOptionsContentProps {
  product: IBaseProduct;
  onDismiss: () => void;
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
  processedOptions: any; // Consider defining a more specific type for processed options
  toppings: ITopping[];
  hasToppings: boolean;
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

  const [processedOptions, setProcessedOptions] = useState<any>({ groups: [] });

  const [toppings, setToppings] = useState<ITopping[]>([]);

  const hasToppings = useMemo(
    () =>
      Boolean(product.ToppingGrpID && Array.isArray(product.Toppings) && product.Toppings.length > 0),
    [product.ToppingGrpID, product.Toppings]
  );

  const isEditing = !!existingItem;

  const optionsReady = useMemo(() => {
    return !loading && processedOptions.groups.length > 0;
  }, [loading, processedOptions]);

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

  const imageUrl = useMemo(() => {
    const imagePath = product.ImgUrl;
    return imagePath ? buildImageUrl(urlForImages, imagePath) : null;
  }, [product, urlForImages]);

  const renderContent = () => {
    if (loading) {
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
            selections={{}}
            onOptionSelect={() => {}}
          />
        )}

        {hasToppings && toppings.length > 0 && (
          <ProductToppings
            toppings={toppings}
            onToppingsChange={() => {}}
            initialSelections={[]}
            maxAllowedToppings={9}
          />
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDismiss}>
      {optionsReady ? (
        <ProductOptionsContent
          key={`${product.ID}-${JSON.stringify(processedOptions?.defaultSelections || {})}`}
          product={product}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
          existingItem={existingItem}
          onDelete={onDelete}
          processedOptions={processedOptions}
          toppings={toppings}
          hasToppings={hasToppings}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={lightColors.primary} />
          <Text style={styles.infoText}>Loading Options...</Text>
        </View>
      )}
    </Modal>
  );
}

export function ProductOptionsContent({
  product,
  onDismiss,
  onConfirm,
  existingItem,
  onDelete,
  processedOptions,
  toppings,
  hasToppings
}: ProductOptionsContentProps) {
  const { getToppingsByGroup } = useToppings();
  const { canAddToBasket: originalCanAddToBasket, isOpen, storeMessage} = useStoreStatus();
  const canAddToBasket = true; // Temporarily set to true for testing
  const { urlForImages } = useStore();

  const [quantity, setQuantity] = useState(Number(existingItem?.quantity) || 1);
  const [toppingSelections, setToppingSelections] = useState<IToppingSelection[]>([]);

  const isEditing = !!existingItem;

  const editSelections = useMemo(() => {
    if (!existingItem?.options) return {};
    return existingItem.options.reduce((acc, opt) => {
      if (opt.option_list_name !== 'Topping') {
        acc[opt.option_list_name] = String(opt.ref); // ← normalize here
      }
      return acc;
    }, {} as IOptionSelections);
  }, [existingItem]);

// Merge defaults (from processedOptions) with edits (edits win)
const baseInitialSelections: IOptionSelections = useMemo(() => {
  return {
    ...(processedOptions?.defaultSelections ?? {}),
    ...editSelections,
  };
}, [processedOptions?.defaultSelections, editSelections]);

  const { selections, validationState, filteredOptions, handleOptionSelect, loading: optionsLoading } = useProductOptions({
    options: processedOptions,
  initialSelections: baseInitialSelections,
  });

  console.log('--- DEBUG useProductOptions ---');
console.log('Processed groups:', processedOptions?.groups?.map((g: any) => g.key));
console.log('Processed defaults:', processedOptions?.defaultSelections);
console.log('Initial selections passed in:', baseInitialSelections);
console.log('Hook selections state:', selections);
console.log('Validation state:', validationState);

  const { formattedPrice, currentPrice } = useRealTimePricing({
    product,
    selections,
    toppingSelections,
    availableToppings: toppings,
    quantity,
  });

  useEffect(() => {
    if (existingItem) {
      const extractedToppings: IToppingSelection[] = existingItem.options
        .filter((option) => option.option_list_name === 'Topping')
        .map((topping) => ({
          id: topping.ref.split('-').pop() || topping.ref,
          name: topping.label,
          portions: topping.quantity,
        }));
      setToppingSelections(extractedToppings);
    } else if (product.Toppings) {
      // Process initial toppings to respect OrgPortion values
      const initialToppingSelections = processToppingSelections(product.Toppings, toppings);
      setToppingSelections(initialToppingSelections);
    }
  }, [existingItem, product.Toppings, toppings]);

  const handleDelete = () => {
    if (existingItem?.id) {
      onDelete?.(existingItem.id);
      onDismiss();
    }
  };

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
  ]);

  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const imageUrl = useMemo(() => {
    const imagePath = product.ImgUrl;
    return imagePath ? buildImageUrl(urlForImages, imagePath) : null;
  }, [product, urlForImages]);

  const renderContent = () => {
    if (optionsLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={lightColors.primary} />
          <Text style={styles.infoText}>Loading Options...</Text>
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
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 180 }}>
        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: '#eee' }]} />
            )}
  
            {/* subtle top gradient + close */}
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent']}
              style={styles.heroTopOverlay}
            />
            <SafeAreaView style={styles.heroSafeTop}>
              {/* <TouchableOpacity onPress={onDismiss} style={styles.closeFab}>
                <Ionicons name="close" size={22} color="#111" />
              </TouchableOpacity> */}
            </SafeAreaView>
          </View>
  
          {/* Title / Description */}
          <View style={styles.titleBlock}>
            <Text style={styles.productName}>{product.Name}</Text>
            {!!product.Description && (
              <Text style={styles.productDescription}>{product.Description}</Text>
            )}
          </View>
        </View>
  
        {/* CONTENT */}
        <View style={styles.contentBlock}>{renderContent()}</View>
      </ScrollView>
  
      {/* STICKY FOOTER */}
      <SafeAreaView style={styles.footer}>
        <View style={styles.stepperWrap}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(-1)}
            style={[styles.stepperBtn, quantity === 1 && styles.stepperBtnDisabled]}
            disabled={quantity === 1}
          >
            <Ionicons
              name="remove"
              size={20}
              color={quantity === 1 ? '#B7BDC5' : lightColors.primary}
            />
          </TouchableOpacity>
  
          <Text style={styles.quantityText}>{quantity}</Text>
  
          <TouchableOpacity onPress={() => handleQuantityChange(1)} style={styles.stepperBtn}>
            <Ionicons name="add" size={20} color={lightColors.primary} />
          </TouchableOpacity>
        </View>
  
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!validationState.isValid || (!canAddToBasket && !isEditing)}
          style={[
            styles.cta,
            (!validationState.isValid || (!canAddToBasket && !isEditing)) && styles.ctaDisabled,
          ]}
        >
          <Text style={styles.ctaText}>{isEditing ? 'Update' : 'Add To Order'}</Text>
  
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{formattedPrice}</Text>
            {/* If you have an original price, show it:
            <Text style={styles.strike}>$13.00</Text>
            */}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },

  /* HERO */
  heroCard: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24, // or 180/250 if you want extra space for the sticky footer
  },
  heroImageWrap: { position: 'relative' },
  heroImage: {
    width: '100%',
    aspectRatio: 1.25, // keeps a nice, consistent hero height
    resizeMode: 'cover',
  },
  heroTopOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 96,
  },
  heroSafeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    alignItems: 'flex-start',
  },
  closeFab: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },

  titleBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: lightColors.text,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },

  /* CONTENT */
  contentBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  /* (kept for loading/errors in renderContent) */
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

  /* STICKY FOOTER */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECF1',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },

  stepperWrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  stepperBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperBtnDisabled: { opacity: 0.45 },

  quantityText: {
    marginHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: lightColors.text,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: lightColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  ctaDisabled: { backgroundColor: '#AAB8C2' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },

  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 84,
  },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  strike: {
    color: '#fff',
    opacity: 0.7,
    textDecorationLine: 'line-through',
    fontSize: 12,
    marginTop: 2,
  },
});
