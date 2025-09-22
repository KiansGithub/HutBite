import React, { useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IBaseProduct } from '@/types/product';
import { IBasketItem } from '@/types/basket';
import Colors from '@/constants/Colors';
import { buildImageUrl } from '@/utils/imageUtils';
import { useStore } from '@/contexts/StoreContext';

const { width: screenWidth } = Dimensions.get('window');
const lightColors = Colors.light;

interface ProductHeaderProps {
  product: IBaseProduct;
  existingItem?: IBasketItem;
  onDismiss: () => void;
  onDelete?: (itemId: string) => void;
}

export function ProductHeader({
  product,
  existingItem,
  onDismiss,
  onDelete,
}: ProductHeaderProps) {
  const { urlForImages } = useStore();
  const isEditing = !!existingItem;

  const imageUrl = useMemo(() => {
    const imagePath = product.ImgUrl;
    return imagePath ? buildImageUrl(urlForImages, imagePath) : null;
  }, [product, urlForImages]);

  const handleDelete = () => {
    if (existingItem?.id && onDelete) {
      onDelete(existingItem.id);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {imageUrl ? (
        <ImageBackground source={{ uri: imageUrl }} style={styles.imageBackground}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                {isEditing && onDelete && (
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.productTitle}>{product.Name}</Text>
                {product.Description && (
                  <Text style={styles.productDescription}>{product.Description}</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={styles.noImageHeader}>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.closeButtonNoImage} onPress={onDismiss}>
              <Ionicons name="close" size={24} color={lightColors.text} />
            </TouchableOpacity>
            {isEditing && onDelete && (
              <TouchableOpacity style={styles.deleteButtonNoImage} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={lightColors.text} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.productTitleNoImage}>{product.Name}</Text>
            {product.Description && (
              <Text style={styles.productDescriptionNoImage}>{product.Description}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
  },
  imageBackground: {
    width: '100%',
    height: 250,
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 40,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(220,53,69,0.8)',
    borderRadius: 20,
    padding: 8,
  },
  noImageHeader: {
    backgroundColor: lightColors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  closeButtonNoImage: {
    backgroundColor: lightColors.surface,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonNoImage: {
    backgroundColor: '#dc3545',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    marginTop: 16,
  },
  productTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  productDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  productTitleNoImage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  productDescriptionNoImage: {
    fontSize: 16,
    color: lightColors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
});
