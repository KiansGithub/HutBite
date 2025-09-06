import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { GlassPanel } from './GlassPanel';
import Colors from '@/constants/Colors';

interface ConfirmationDialogProps {
    visible: boolean; 
    title: string; 
    message: string; 
    confirmText?: string; 
    cancelText?: string; 
    onConfirm: () => void; 
    onCancel: () => void; 
    loading?: boolean; 
    destructive?: boolean; 
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    visible, 
    title, 
    message, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm, 
    onCancel, 
    loading = false, 
    destructive = false, 
}) => {
    return (
        <Modal 
          visible={visible}
          transparent 
          animationType="fade"
          onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <GlassPanel style={styles.dialog}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                          style={[styles.button, styles.cancelButton]}
                          onPress={onCancel}
                          disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[
                            styles.button, 
                            destructive ? styles.destructiveButton: styles.confirmButton, 
                            loading && styles.buttonDisabled, 
                          ]}
                          onPress={onConfirm}
                          disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </GlassPanel>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24, 
    },
    dialog: {
        width: '100%',
        maxWidth: 400, 
        padding: 24, 
    },
    title: {
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12, 
    },
    message: {
        fontSize: 16, 
        color: 'rgba(255, 255, 255, 0.85)', 
        textAlign: 'center',
        lineHeight: 22, 
        marginBottom: 24, 
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12, 
    },
    button: {
        flex: 1, 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 12, 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44, 
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    confirmButton: {
        backgroundColor: Colors.light.primary 
    },
    destructiveButton: {
        backgroundColor: '#FF3B30',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16, 
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16, 
        fontWeight: '600'
    },
});