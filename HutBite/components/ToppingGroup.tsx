import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { ITopping, IToppingSelection } from '@/types/toppings';
import { ToppingPortionControl } from './ToppingPortionControl';
import { buildImageUrl } from '@/utils/imageUtils';
import { useStore } from '@/store/StoreContext';
import { Colors } from '@/constants/Colors';
 
const baseColors = Colors.light;
 
interface ToppingItemProps {
    topping: ITopping;
    selected: boolean;
    portions: number;
    onToggle: (id: string) => void;
    onPortionChange: (id: string, portions: number) => void;
    isInvalid?: boolean;
}
 
const ToppingItem = React.memo<ToppingItemProps>(({
    topping,
    selected,
    portions,
    onToggle,
    onPortionChange,
    isInvalid
}) => {
    const theme = useTheme();
    const { urlForImages } = useStore();
 
    const imageSource = topping.ImgUrl
        ? { uri: topping.ImgUrl.startsWith('http') ? topping.ImgUrl : buildImageUrl(urlForImages, topping.ImgUrl) }
        : null;
 
    const handlePress = () => {
        let nextPortion;
        if (portions === 0) {
            nextPortion = 1;
        } else if (portions === 1) {
            nextPortion = 2;
        } else {
            nextPortion = 0;
        }
        onPortionChange(topping.ID, nextPortion);
    };
 
    return (
        <TouchableRipple onPress={handlePress}>
            <View style={[
                styles.toppingItem,
                portions > 0 && styles.selectedToppingItem,
                isInvalid && { borderColor: theme.colors.error, borderWidth: 1 }
            ]}>
                <View style={styles.toppingInfo}>
                    <View style={styles.toppingImageContainer}>
                        {imageSource ? (
                            <Image
                                source={imageSource}
                                style={styles.toppingImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.toppingImage, styles.placeholderImage]} />
                        )}
                    </View>
                    <View style={styles.toppingDetails}>
                        <Text style={styles.toppingName}>{topping.Name}</Text>
                    </View>
                </View>
                <ToppingPortionControl
                    value={portions}
                    onChange={(value) => onPortionChange(topping.ID, value)}
                />
            </View>
        </TouchableRipple>
    );
});
 
interface ToppingGroupProps {
    toppings: ITopping[];
    selections: IToppingSelection[];
    onToppingToggle: (id: string) => void;
    onPortionChange: (id: string, portions: number) => void;
    invalidSelections: string[];
    isOneChoice?: boolean; 
}
 
export const ToppingGroup: React.FC<ToppingGroupProps> = ({
    toppings,
    selections,
    onToppingToggle,
    onPortionChange,
    invalidSelections,
    isOneChoice = false
}) => {
    return (
        <View style={styles.groupContainer}>
            {toppings.map((topping) => {
                const selectedTopping = selections.find((s) => s.id === topping.ID);
                return (
                    <ToppingItem
                        key={topping.ID}
                        topping={topping}
                        selected={!!selectedTopping}
                        portions={selectedTopping?.portions || 0}
                        onToggle={onToppingToggle}
                        onPortionChange={onPortionChange}
                        isInvalid={invalidSelections.includes(topping.ID)}
                    />
                );
            })}
        </View>
    );
};
 
const styles = StyleSheet.create({
    groupContainer: {
        backgroundColor: baseColors.surface,
    },
    toppingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: baseColors.background,
    },
    selectedToppingItem: {
        backgroundColor: baseColors.accent + '20',
        borderLeftWidth: 4,
        borderLeftColor: baseColors.primary
    },
    toppingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    toppingImageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
    },
    toppingImage: {
        width: '100%',
        height: '100%'
    },
    placeholderImage: {
        backgroundColor: baseColors.border
    },
    toppingDetails: {
        flex: 1,
    },
    toppingName: {
        fontSize: 16,
        fontWeight: '500',
    },
});