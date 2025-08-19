import React, { useState } from 'react';
import { 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    FlatList, 
    Modal 
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useRestaurantData } from '@/hooks/useRestaurantData';

interface MenuItemSelectorProps {
    restaurantId?: string; 
    selectedMenuItemId?: string; 
    selectedMenuItemName?: string; 
    onMenuItemSelect: (menuItemId: string, menuItemName: string) => void; 
    disabled?: boolean; 
    hasCustomRestaurant?: boolean; 
}

export const MenuItemSelector: React.FC<MenuItemSelectorProps> = ({
    restaurantId, 
    selectedMenuItemId, 
    selectedMenuItemName, 
    onMenuItemSelect, 
    disabled = false, 
    hasCustomRestaurant = false, 
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { menuItems } = useRestaurantData();

    const availableMenuItems = restaurantId ? menuItems[restaurantId] || [] : [];

    const handleMenuItemSelect = (menuItem: any) => {
        onMenuItemSelect(menuItem.id, menuItem.title); 
        setModalVisible(false);
    };

    if (disabled || (!restaurantId && !hasCustomRestaurant)) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>Menu Item (optional)</Text>
                <View style={[styles.selector, styles.disabled]}>
                    <Text style={styles.disabledText}>
                    {!restaurantId && !hasCustomRestaurant ? 'Select a restaurant first': 'No menu items available'}
                    </Text>
                </View>
            </View>
        );
    }

    // If we have a custom restaurant but no restaurantId, show appropriate message
    if (hasCustomRestaurant && !restaurantId) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>Menu Item (optional)</Text>
                <View style={[styles.selector, styles.disabled]}>
                    <Text style={styles.disabledText}>
                        Menu items not available for new restaurants
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
      <Text style={styles.label}>Menu Item (Optional)</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, !selectedMenuItemName && styles.placeholder]}>
          {selectedMenuItemName || 'Select menu item (optional)'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.light.primary} />
      </TouchableOpacity>
 
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Menu Item</Text>
            <TouchableOpacity onPress={() => {
              onMenuItemSelect('', '');
              setModalVisible(false);
            }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
 
          <FlatList
            data={availableMenuItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemSelect(item)}
              >
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.menuItemPrice}>
                  {item.price ? `$${item.price.toFixed(2)}` : ''}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No menu items available</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20, 
    },
    label: {
        fontSize: 17, 
        fontWeight: '600',
        marginBottom: 8, 
        color: '#333',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, 
        backgroundColor: '#f8f9fa',
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#e9ecef'
    },
    disabled: {
        opacity: 0.6, 
    },
    selectorText: {
        fontSize: 16, 
        color: '#333',
        flex: 1, 
    },
    placeholder: {
        color: '#999',
    },
    disabledText: {
        color: '#999',
        fontSize: 16, 
    },
    modal: {
        flex: 1, 
        backgroundColor: '#fff'
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 18, 
        fontWeight: '600'
    },
    cancelText: {
        color: Colors.light.primary, 
        fontSize: 16, 
    },
    clearText: {
        color: '#666',
        fontSize: 16, 
    },
    menuItem: {
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f3f4',
    },
    menuItemTitle: {
        fontSize: 16, 
        fontWeight: '600',
        marginBottom: 4, 
        color: '#333',
    },
    menuItemDescription: {
        fontSize: 14, 
        color: Colors.light.primary, 
        fontWeight: '600',
    },
    menuItemPrice: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '600',
      },
    emptyContainer: {
        padding: 32, 
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16, 
    },
});