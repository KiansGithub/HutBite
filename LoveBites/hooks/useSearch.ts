import { useState, useMemo } from 'react';
import { Database } from '@/lib/supabase.d';
import { normalizeCuisine } from '@/utils/cuisine';

interface UserProfile {
  id: string; 
  user_id: string; 
  handle: string | null; 
  display_name: string | null; 
  avatar_url: string | null; 
  bio: string | null; 
  is_private: boolean; 
}
 
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
 
interface SearchResult {
  restaurant: Restaurant;
  score: number;
  matchType: 'name' | 'description' | 'tag' | 'cuisine';
  matchedCuisines?: string[];
}
 
export const useSearch = (restaurants: Restaurant[], users: UserProfile[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'restaurants' | 'users'>('all');
 
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return restaurants;
    }
 
    const query = searchQuery.toLowerCase().trim();
    const resultsMap = new Map<string, SearchResult>();
 
    restaurants.forEach(restaurant => {
      let totalScore = 0; 
      let bestMatchType: 'name' | 'description' | 'tag' | 'cuisine' = 'name';
      let matchedCuisines: string[] = [];

      // Cuisine matching (high priority)
      if (restaurant.cuisines && restaurant.cuisines.length > 0) {

        restaurant.cuisines.forEach(cuisine => {
          const normalizedCuisine = normalizeCuisine(cuisine);
          if (normalizedCuisine.includes(query) || query.includes(normalizedCuisine)) {
            matchedCuisines.push(cuisine);
            totalScore += normalizedCuisine === query ? 90 : 70;
            bestMatchType = 'cuisine';
          }
        });
      }
 
      // Name matching (highest priority)
      const name = restaurant.name.toLowerCase();
      if (name.includes(query)) {
        totalScore += name.startsWith(query) ? 100 : 80;
        if (totalScore >= 80) bestMatchType = 'name';
      }
 
      // Fuzzy name matching
      if (!name.includes(query)) {
        const nameScore = calculateFuzzyScore(query, name);
        if (nameScore > 0.6) {
          totalScore += nameScore * 60; 
          if (totalScore >= 36) bestMatchType = 'name';
        }
      }
 
      // Description/tags matching
      if (restaurant.description) {
        const description = restaurant.description.toLowerCase();
        const tags = extractTags(description);
 
        // Direct description match
        if (description.includes(query)) {
          totalScore += 40; 
          if (bestMatchType === 'name' && totalScore < 80) bestMatchType = 'description';
        }
 
        // Tag matching
        tags.forEach(tag => {
          if (tag.includes(query)) {
            totalScore += tag === query ? 70 : 50;
            if (bestMatchType === 'name' && totalScore < 80) bestMatchType = 'tag';
          }
        });
 
        // Fuzzy tag matching
        if (!tags.some(tag => tags.includes(query))) {
          tags.forEach(tag => {
            const tagScore = calculateFuzzyScore(query, tag);
            if (tagScore > 0.7) {
              totalScore += tagScore * 30; 
              if (bestMatchType === 'name' && totalScore < 80) bestMatchType = 'tag';
            }
          });
        }
      }
 
      // Only add results if theres a match 
      if (totalScore > 0) {
        resultsMap.set(restaurant.id.toString(), {
          restaurant, 
          score: totalScore, 
          matchType: bestMatchType, 
          ...(matchedCuisines.length > 0 && { matchedCuisines })
        });
      }
    });
 
    // Sort by score (highest first)
    return Array.from(resultsMap.values())
      .sort((a, b) => b.score - a.score)
      .map(result => result.restaurant);
  }, [restaurants, searchQuery]);
 
  return {
    searchQuery,
    setSearchQuery,
    searchResult: searchType === 'users' ? [] : searchResults,
    userResults: searchType === 'restaurants' ? [] : userResults, 
    isSearching: searchQuery.trim().length > 0,
    searchType, 
    setSearchType, 
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