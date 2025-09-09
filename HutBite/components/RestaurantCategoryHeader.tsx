import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import type { MenuCategory } from '@/types/store';

const colors = Colors.light;

interface RestaurantCategoryHeaderProps {
  categories: MenuCategory[];
  selectedCategoryId: string | null;
  onCategoryPress: (categoryId: string) => void;
}

export function RestaurantCategoryHeader({ 
  categories, 
  selectedCategoryId, 
  onCategoryPress 
}: RestaurantCategoryHeaderProps) {

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background, 
      borderBottomColor: colors.tabIconDefault + '20' 
    }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity 
            key={`${category.ID}-${index}`}
            onPress={() => onCategoryPress(category.ID)}
            style={[
              styles.tabContainer,
              selectedCategoryId === category.ID && [
                styles.activeTabContainer,
                { borderBottomColor: colors.primary }
              ]
            ]}
          >
            <Text 
              style={[
                styles.tabText,
                { color: colors.text },
                selectedCategoryId === category.ID && { 
                  color: colors.primary, 
                  fontWeight: '700' 
                },
              ]}
            >
              {category.Name || 'Category'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  tabContainer: {
    height: '100%',
    marginRight: 24,
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  activeTabContainer: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
