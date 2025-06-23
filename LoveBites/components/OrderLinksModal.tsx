import React from 'react';
import { StyleSheet, TouchableOpacity, Linking, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
 
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
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.light.primary,
    fontWeight: '600',
  },
});