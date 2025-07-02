import React from 'react';
import { 
    StyleSheet, 
    TextInput, 
    View, 
    TouchableOpacity, 
    Dimensions, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const { width: W } = Dimensions.get('window');

interface SearchBarProps {
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder?: string; 
    onClear?: () => void; 
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value, 
    onChangeText, 
    placeholder = "Search restaurants, cuisines...",
    onClear, 
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons 
                  name="search"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput 
                  style={styles.input}
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={placeholder}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType='search'
                />
                {value.length > 0 && (
                    <TouchableOpacity 
                      onPress={onClear || (() => onChangeText(''))}
                      style={styles.clearButton}
                    >
                        <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 25, 
        paddingHorizontal: 15, 
        paddingVertical: 12, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 2, 
    },
    searchIcon: {
        marginRight: 10, 
    },
    input: {
        flex: 1,
        fontSize: 16, 
        color: '#333',
        paddingVertical: 0, 
    }, 
    clearButton: {
        marginLeft: 10, 
        padding: 2, 
    },
});