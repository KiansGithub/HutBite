export const formatReviewCount = (count: number | null): string => {
    if (!count || count === 0) return '';
   
    if (count < 1000) {
      return `${count} reviews`;
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K reviews`;
    } else {
      return `${(count / 1000000).toFixed(1)}M reviews`;
    }
  };

export const formatGoogleRating = (rating: number | null): string => {
    if (!rating) return '';
    return rating.toFixed(1);
};

export const renderStarRating = (rating: number | null): string => {
    if (!rating) return '';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;


    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';

    return stars; 
};