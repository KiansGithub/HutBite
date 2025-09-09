import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { IToppingGroupInfo } from '@/utils/toppingGroupUtils';
import { Colors } from '@/constants/Colors';
 
const baseColors = Colors.light;
 
interface ToppingGroupHeaderProps {
    groups: IToppingGroupInfo[];
    selectedGroup: string | null;
    onGroupSelect: (groupKey: string) => void;
}
 
export const ToppingGroupHeader: React.FC<ToppingGroupHeaderProps> = ({
    groups,
    selectedGroup,
    onGroupSelect
}) => {
    const theme = useTheme();
 
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {groups.map((group) => (
                    <Chip
                        key={group.originalGroup}
                        mode={selectedGroup === group.originalGroup ? 'flat' : 'outlined'}
                        selected={selectedGroup === group.originalGroup}
                        onPress={() => onGroupSelect(group.originalGroup)}
                        style={[
                            styles.chip,
                            selectedGroup === group.originalGroup && {
                                backgroundColor: theme.colors.primary
                            }
                        ]}
                        textStyle={[
                            styles.chipText,
                            selectedGroup === group.originalGroup && {
                                color: theme.colors.onPrimary
                            }
                        ]}
                    >
                        {group.displayName}
                    </Chip>
                ))}
            </ScrollView>
        </View>
    );
};
 
const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: baseColors.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        marginRight: 8,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
});