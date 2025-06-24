import React from 'react';
import { 
    TouchableOpacity, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    ViewStyle, 
    TextStyle
} from 'react-native';
import Colors from '@/constants/Colors';

interface CTAButtonProps {
    title: string; 
    onPress: () => void; 
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean; 
    disabled?: boolean; 
    style?: ViewStyle; 
    textStyle?: TextStyle; 
}

export const CTAButton: React.FC<CTAButtonProps> = ({
    title, 
    onPress, 
    variant = 'primary',
    size = 'medium',
    loading = false, 
    disabled = false, 
    style, 
    textStyle
}) => {
    const buttonStyle = [
        styles.base, 
        styles[variant],
        styles[size], 
        (loading || disabled) && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.baseText, 
        styles[`${variant}Text`],
        styles[`${size}Text`],
        textStyle,
    ];

    return (
        <TouchableOpacity 
          style={buttonStyle}
          onPress={onPress}
          disabled={loading || disabled}
          activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.light.primary : '#fff'} />
            ): (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 999, 
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF774B',
        shadowOpacity: 0.25, 
        shadowRadius: 8, 
        shadowOffset: { width: 0, height: 4 },
    },
    primary: {
        backgroundColor: Colors.light.primary,
    },
    secondary: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.35)',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2, 
        borderColor: Colors.light.primary, 
    },
    small: {
        paddingVertical: 8, 
        paddingHorizontal: 16
    },
    medium: {
        paddingVertical: 12, 
        paddingHorizontal: 24, 
    },
    large: {
        paddingVertical: 16, 
        paddingHorizontal: 32
    },
    disabled: {
        opacity: 0.7,
    },
    baseText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: '#fff',
    },
    outlineText: {
        color: Colors.light.primary,
    },
    smallText: {
        fontSize: 14, 
    },
    mediumText: {
        fontSize: 16
    },
    largeText: {
        fontSize: 18,
    },
});