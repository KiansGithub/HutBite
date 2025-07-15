import { useState, useMemo } from 'react';
import { Database } from '@/lib/supabase.d';
import { normalizeCuisine } from '@/utils/cuisine';
 
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
 
interface SearchResult {
  restaurant: Restaurant;
  score: number;
  matchType: 'name' | 'description' | 'tag' | 'cuisine';
  matchedCuisines?: string[];
}
 
export const useSearch = (restaurants: Restaurant[]) => {
  const [searchQuery, setSearchQuery] = useState('');
 
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return restaurants;
    }
 
    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];
 
    restaurants.forEach(restaurant => {
      let score = 0;
      let matchType: 'name' | 'description' | 'tag' = 'name';

      // Cuisine matching (high priority)
      if (restaurant.cuisines && restaurant.cuisines.length > 0) {
        const matchedCuisines: string[] = [];

        restaurant.cuisines.forEach(cuisine => {
          const normalizedCuisine = normalizeCuisine(cuisine);
          if (normalizedCuisine.includes(query) || query.includes(normalizedCuisine)) {
            matchedCuisines.push(cuisine);
            score += normalizedCuisine === query ? 90 : 70;
            matchType = 'cuisine';
          }
        });

        if (matchedCuisines.length > 0) {
          results.push({ restaurant, score, matchType, matchedCuisines });
        }
      }
 
      // Name matching (highest priority)
      const name = restaurant.name.toLowerCase();
      if (name.includes(query)) {
        score += name.startsWith(query) ? 100 : 80;
        matchType = 'name';
      }
 
      // Fuzzy name matching
      if (score === 0) {
        const nameScore = calculateFuzzyScore(query, name);
        if (nameScore > 0.6) {
          score += nameScore * 60;
          matchType = 'name';
        }
      }
 
      // Description/tags matching
      if (restaurant.description) {
        const description = restaurant.description.toLowerCase();
        const tags = extractTags(description);
 
        // Direct description match
        if (description.includes(query)) {
          score += 40;
          matchType = 'description';
        }
 
        // Tag matching
        tags.forEach(tag => {
          if (tag.includes(query)) {
            score += tag === query ? 70 : 50;
            matchType = 'tag';
          }
        });
 
        // Fuzzy tag matching
        if (score === 0) {
          tags.forEach(tag => {
            const tagScore = calculateFuzzyScore(query, tag);
            if (tagScore > 0.7) {
              score += tagScore * 30;
              matchType = 'tag';
            }
          });
        }
      }
 
      if (score > 0) {
        results.push({ restaurant, score, matchType });
      }
    });
 
    // Sort by score (highest first)
    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.restaurant);
  }, [restaurants, searchQuery]);
 
  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching: searchQuery.trim().length > 0,
  };
};
 
// Extract potential tags from description
function extractTags(description: string): string[] {
  const commonTags = [
    'pizza', 'burger', 'sushi', 'chinese', 'indian', 'italian', 'mexican',
    'thai', 'japanese', 'korean', 'american', 'fast food', 'fine dining',
    'casual', 'delivery', 'takeaway', 'vegan', 'vegetarian', 'halal',
    'seafood', 'steakhouse', 'cafe', 'bakery', 'dessert', 'healthy',
    'organic', 'local', 'family', 'romantic', 'cheap', 'expensive'
  ];
 
  const words = description.toLowerCase().split(/\s+/);
  const tags: string[] = [];
 
  // Add words that match common food tags
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (commonTags.some(tag => tag.includes(cleanWord) || cleanWord.includes(tag))) {
      tags.push(cleanWord);
    }
  });
 
  // Add exact matches for common tags
  commonTags.forEach(tag => {
    if (description.includes(tag)) {
      tags.push(tag);
    }
  });
 
  return [...new Set(tags)]; // Remove duplicates
}
 
// Simple fuzzy matching algorithm
function calculateFuzzyScore(query: string, target: string): number {
  if (query === target) return 1;
  if (query.length === 0) return 0;
 
  let score = 0;
  let queryIndex = 0;
 
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      score++;
      queryIndex++;
    }
  }
 
  return score / query.length;
}