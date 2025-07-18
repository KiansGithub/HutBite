import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Themed';
import { formatReviewCount, formatGoogleRating } from '@/utils/googlePlaces';

interface GoogleRatingProps {
    rating: number | null; 
    reviewCount: number | null; 
}

export const GoogleRating: React.FC<GoogleRatingProps> = ({ rating, reviewCount }) => {
    if (!rating && !reviewCount) return null; 

    return (
        <View style={styles.container}>
            {rating && (
                <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>
                    ⭐ {formatGoogleRating(rating)}
                    </Text>
                </View>
            )}
            {reviewCount && (
                <Text style={styles.reviewText}>
                    Based on {formatReviewCount(reviewCount)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 4
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    ratingText: {
        fontSize: 14, 
        fontWeight: '600',
        color: '#FFD700',
    },
    reviewCount: {
        fontSize: 12, 
        opacity: 0.8
    },
    reviewText: {
        fontSize: 12, 
        opacity: 0.8, 
    },
})