import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text } from './Themed';
import { formatGoogleRating } from '@/utils/googlePlaces';

interface GoogleRatingProps {
    rating: number | null; 
    reviewCount: number | null; 
}

export const GoogleRating: React.FC<GoogleRatingProps> = ({ rating, reviewCount }) => {
    if (!rating) return null; 

    return (
        <View style={styles.container}>
            <View style={styles.ratingContainer}>
                <Image 
                    source={require('@/assets/images/google_logo.png')} 
                    style={styles.googleLogo}
                    resizeMode="contain"
                />
                <Text style={styles.ratingText}>
                    {formatGoogleRating(rating)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 4,
    },
    googleLogo: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    ratingText: {
        fontSize: 14, 
        fontWeight: '600',
        color: '#1a1a1a',
    },
})