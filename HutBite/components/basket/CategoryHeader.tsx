import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';

import { ThemedText } from './ThemedText';
import type { MenuGroup } from '@/types/store';

const colors = Colors.light;

interface CategoryHeaderProps {
    groups: MenuGroup[];
    selectedGroupId: string | null;
    onGroupPress: (groupId: string) => void;
}

export function CategoryHeader({ groups, selectedGroupId, onGroupPress }: CategoryHeaderProps) {

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.accent }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }]}
            >
                {groups.map((group) => (
                    <TouchableOpacity 
                      key={group.ID}
                      onPress={() => onGroupPress(group.ID)}
                      style={styles.tabContainer}
                    >
                        <ThemedText 
                          style={[
                            styles.tabText,
                            { color: colors.text },
                            selectedGroupId === group.ID && { color: colors.primary, fontWeight: '700'},
                          ]}
                        >
                            {group.Name}
                        </ThemedText>
                        {/* {selectedGroupId === group.ID && (
                            <Animated.View 
                              style={[
                                styles.activeIndicator, 
                                { backgroundColor: Colors.light.accent },
                                activeIndicatorStyle,
                              ]}
                            />
                        )} */}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 48, 
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    tabContainer: {
        height: '100%',
        marginRight: 24, 
        justifyContent: 'center',
        position: 'relative',
    },
    tabText: {
        fontSize: 16, 
        fontWeight: '500',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2, 
        borderRadius: 1,
    },
});