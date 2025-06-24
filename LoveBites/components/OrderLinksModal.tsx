import React from 'react';
import { StyleSheet, TouchableOpacity, Linking, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
 
interface OrderLinksModalProps {
  orderLinks: Record<string, string> | null;
  onClose: () => void;
}
 
export const OrderLinksModal: React.FC<OrderLinksModalProps> = ({
  orderLinks,
  onClose,
}) => {
  if (!orderLinks) return null;
 
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.container} pointerEvents="auto">
        {Object.entries(orderLinks).map(([platform, url]) => (
          <TouchableOpacity
            key={platform}
            style={styles.linkButton}
            onPress={() => Linking.openURL(url)}
          >
            <FontAwesome name="link" size={24} color="#fff" />
            <Text style={styles.linkText}>{platform}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
 
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: '#333',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 10,
  },
  linkText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});