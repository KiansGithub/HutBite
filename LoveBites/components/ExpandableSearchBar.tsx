import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExpandableSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onExpand?: () => void; 
  onCollapse?: () => void; 
  style?: StyleProp<ViewStyle>;
  expanded?: boolean;
}

export const ExpandableSearchBar: React.FC<ExpandableSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search restaurants, cuisines...',
  onClear,
  onExpand, 
  onCollapse, 
  style,
  expanded: expandedProp,
}) => {
  const [expanded, setExpanded] = useState<boolean>(expandedProp ?? false);
  const inputRef = useRef<TextInput>(null);

  // Keep interal state in sync with controlled prop 
  React.useEffect(() => {
    if (expandedProp !== undefined) {
      setExpanded(expandedProp);
      if (expandedProp) {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      } else {
        inputRef.current?.blur();
      }
    }
  }, [expandedProp]);

  const expand = () => {
    if (expandedProp === undefined) {
      setExpanded(true);
    }
    onExpand?.();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const collapse = () => {
    inputRef.current?.blur();
    if (expandedProp === undefined) {
      setExpanded(false);
    }
    onCollapse?.();
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      {expanded ? (
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={collapse} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#666" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                onClear?.();
                collapse();
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity onPress={expand} style={styles.iconButton}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  iconButton: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
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
  backButton: {
    paddingRight: 10,
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