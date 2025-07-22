import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export interface CuisineFilterOptions {
    cuisines: string[];
    matchAll?: boolean; 
}

export interface CuisineMatchResult {
    restaurant: Restaurant;
    matchedCuisines: string[];
    matchScore: number; 
}

/**
 * Filter restaurants by cuisine(s)
 */
export const filterRestaurantsByCuisine = (
    restaurants: Restaurant[],
    options: CuisineFilterOptions
): Restaurant[] => {
    if (!options.cuisines.length) {
        return restaurants;
    }

    const normalizedFilterCuisines = options.cuisines.map(c => c.toLowerCase().trim());

    return restaurants.filter(restaurant => {
        if (!restaurant.cuisines || !restaurant.cuisines.length) {
            return false;
        }

        const normalizedRestaurantCuisines = restaurant.cuisines.map(c => c.toLowerCase().trim());

        if (options.matchAll) {
            // Restaurant must have ALL specified cuisines 
            return normalizedFilterCuisines.every(filterCuisine => 
                normalizedRestaurantCuisines.includes(filterCuisine)
            );
        } else {
            // Restaurant must have ANY of the specified cuisines 
            return normalizedFilterCuisines.some(filterCuisine =>
                normalizedRestaurantCuisines.includes(filterCuisine)
            );
        }
    });
};

/**
 * Get unique cuisines from a list of restaurants
 */
export const getUniqueCuisines = (restaurants: Restaurant[]): string[] => {
    const cuisineSet = new Set<string>();

    restaurants.forEach(restaurant => {
        if (restaurant.cuisines) {
            restaurant.cuisines.forEach(cuisine => {
                cuisineSet.add(cuisine.toLowerCase().trim());
            });
        }
    });

    return Array.from(cuisineSet).sort();
};

/**
 * Get cuisine counts from a list of restaurants 
 */
export const getCuisineCounts = (restaurants: Restaurant[]): Record<string, number> => {
    const counts: Record<string, number> = {};

    restaurants.forEach(restaurant => {
        if (restaurant.cuisines) {
            restaurant.cuisines.forEach(cuisine => {
                const normalizedCuisine = cuisine.toLowerCase().trim();
                counts[normalizedCuisine] = (counts[normalizedCuisine] || 0) + 1;
            });
        }
    });
    
    return counts; 
};

/**
 * Match restaurants by cuisine with scoring
 */
export const matchRestaurantsByCuisine = (
    restaurants: Restaurant[],
    targetCuisines: string[]
): CuisineMatchResult[] => {
    if (!targetCuisines.length) {
        return restaurants.map(restaurant => ({
            restaurant, 
            matchedCuisines: [],
            matchScore: 0
        }));
    }

    const normalizedTargetCuisines = targetCuisines.map(c => c.toLowerCase().trim());
    const results: CuisineMatchResult[] = [];

    restaurants.forEach(restaurant => {
        if (!restaurant.cuisines || !restaurant.cuisines.length) {
            results.push({
                restaurant, 
                matchedCuisines: [],
                matchScore: 0
            });
            return;
        }

        const normalizedRestaurantCuisines = restaurant.cuisines.map(c => c.toLowerCase().trim());
        const matchedCuisines: string[] = [];

        normalizedTargetCuisines.forEach(targetCuisine => {
            if (normalizedRestaurantCuisines.includes(targetCuisine)) {
                matchedCuisines.push(targetCuisine);
            }
        });

        const matchScore = matchedCuisines.length / normalizedTargetCuisines.length; 

        results.push({
            restaurant, 
            matchedCuisines, 
            matchScore
        });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Check if a restaurant has specific cuisine(s)
 */
export const restaurantHasCuisine = (
    restaurant: Restaurant, 
    cuisine: string | string[]
): boolean => {
    if (!restaurant.cuisines || !restaurant.cuisines.length) {
        return false; 
    }

    const normalizedRestaurantCuisines = restaurant.cuisines.map(c => c.toLowerCase().trim());

    if (typeof cuisine === 'string') {
        return normalizedRestaurantCuisines.includes(cuisine.toLowerCase().trim());
    }

    const normalizedTargetCuisines = cuisine.map(c => c.toLowerCase().trim());
    return normalizedTargetCuisines.some(targetCuisine => 
        normalizedRestaurantCuisines.includes(targetCuisine)
    );
};

/**
 * Get popular cuisines (most common across restaurants)
 */
export const getPopularCuisines = (
    restaurants: Restaurant[],
    limit: number = 10
): Array<{ cuisine: string; count: number }> => {
    const counts = getCuisineCounts(restaurants);

    return Object.entries(counts)
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
};

/**
 * Normalize cuisine string for consistent comparison
 */
export const normalizeCuisine = (cuisine: string): string => {
    return cuisine.toLowerCase().trim();
};

/**
 * Common cuisine categories for standardization
 */
export const COMMON_CUISINES = [
  'spanish',
  'pizza',
  'indian',
  'italian',
  'burgers',
  'chinese',
  'mexican',
  'japanese',
  'thai',
  'french',
  'greek',
  'korean',
  'vietnamese',
  'mediterranean',
  'middle eastern',
  'seafood',
  'steakhouse',
  'fast food',
  'cafe',
  'bakery',
  'dessert',
  'vegan',
  'vegetarian',
  'healthy',
  'sushi'
] as const;

export type CommonCuisine = typeof COMMON_CUISINES[number];