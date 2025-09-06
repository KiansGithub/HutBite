import React, { useState } from 'react';
import {
    View, 
    StyleSheet, 
    TouchableOpacity, 
    FlatList, 
    Modal, 
    TextInput 
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useRestaurantData } from '@/hooks/useRestaurantData';

interface RestaurantSelectorProps {
    selectedRestaurantId?: string; 
    selectedRestaurantName?: string; 
    onRestaurantSelect: (restarauntId: string, restaurantName: string) => void; 
    onCustomRestaurantName: (name: string) => void; 
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
    selectedRestaurantId, 
    selectedRestaurantName, 
    onRestaurantSelect, 
    onCustomRestaurantName, 
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customName, setCustomName] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const { restaurants } = useRestaurantData();

    const filteredRestaurants = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRestaurantSelect = (restaurant: any) => {
        onRestaurantSelect(restaurant.id, restaurant.name); 
        setModalVisible(false);
        setSearchQuery('');
        setShowCustomInput(false);
    };

    const handleCustomSubmit = () => {
        if (customName.trim()) {
            onCustomRestaurantName(customName.trim());
            setModalVisible(false);
            setCustomName('');
            setShowCustomInput(false);
        }
    }; 

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Restaurant</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.selectorText, !selectedRestaurantName && styles.placeholder]}>
                    {selectedRestaurantName || 'Select restaurant or add new'}
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
                        <Text style={styles.modalTitle}>Select a Restaurant</Text>
                        <TouchableOpacity onPress={() => setShowCustomInput(!showCustomInput)}>
                            <Text style={styles.addNewText}>Add New </Text>
                        </TouchableOpacity>
                    </View>

                    {showCustomInput ? (
                        <View style={styles.customInputContainer}>
                            <TextInput 
                              style={styles.customInput}
                              placeholder="Enter restaurant name"
                              value={customName}
                              onChangeText={setCustomName}
                              autoFocus 
                            />
                            <TouchableOpacity 
                              style={styles.submitButton}
                              onPress={handleCustomSubmit}
                            >
                                <Text style={styles.submitButtonText}>Add</Text>
                            </TouchableOpacity> 
                        </View>
                    ) : (
                        <>
                          <TextInput 
                            style={styles.searchInput}
                            placeholder="Search restaurants..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList 
                          data={filteredRestaurants}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity 
                              style={styles.restaurantItem}
                              onPress={() => handleRestaurantSelect(item)}
                            >
                                <Text style={styles.restaurantName}>{item.name}</Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                              <Text style={styles.emptyText}>No restaurants found</Text>
                            </View>
                          }
                        />
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
    },
    label: {
        fontSize: 16, 
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
        borderColor: '#e9ecef',
    },
    selectorText: {
        fontSize: 16, 
        color: '#333',
        flex: 1, 
    },
    placeholder: {
        color: '#999',
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
        fontWeight: '600',
    },
    cancelText: {
        color: Colors.light.primary, 
        fontSize: 16, 
    },
    addNewText: {
        color: Colors.light.primary, 
        fontSize: 16, 
        fontWeight: '600',
    },
    searchInput: {
        margin: 16, 
        padding: 12, 
        backgroundColor: '#f8f9fa',
        borderRadius: 8, 
        fontSize: 16, 
    },
    customInputContainer: {
        flexDirection: 'row',
        margin: 16, 
        gap: 12, 
    },
    customInput: {
        flex: 1, 
        padding: 12, 
        backgroundColor: '#f8f9fa',
        borderRadius: 8, 
        fontSize: 16, 
    },
    submitButton: {
        backgroundColor: Colors.light.primary, 
        paddingHorizontal: 20, 
        paddingVertical: 12, 
        borderRadius: 8, 
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600'
    },
    restaurantItem: {
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f3f4'
    },
    restaurantName: {
        fontSize: 16, 
        fontWeight: '600',
        marginBottom: 4, 
        color: '#333',
    },
    restaurantAddress: {
        fontSize: 14, 
        color: '#666'
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