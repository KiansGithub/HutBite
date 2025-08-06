import React, { useState, useEffect } from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/hooks/useSearch';
import { useAuthStore } from '@/store/authStore';
import { GlassPanel } from '@/components/GlassPanel';
import { UserCard } from '@/components/UserCard';
import Colors from '@/constants/Colors';

interface UserProfile {
    id: string; 
    user_id: string; 
    handle: string | null; 
    display_name: string | null; 
    avatar_url: string | null; 
    bio: string | null; 
    is_private: boolean; 
}

export default function DiscoverScreen() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const {
        searchQuery, 
        setSearchQuery, 
        userResults, 
        isSearching, 
        searchType, 
        setSearchType,
    } = useSearch([], users);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 DISCOVER: Fetching users, current user ID:', user?.id);
 
            let query = supabase 
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            // Only filter out current user if we have a valid user ID
            if (user?.id) {
                query = query.neq('user_id', user.id);
            }
 
            const { data, error } = await query;
 
            console.log('🔍 DISCOVER: Query result:', { data: data?.length, error });
 
            if (error) throw error; 

            setUsers(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const displayedUsers = isSearching ? userResults: users; 

    return (
        <RequireAuth>
        <LinearGradient 
            colors={['#FF512F', '#F09819', '#FFB347']}
            start={{ x: 0, y: 0}}
            end={{ x: 1, y: 1}}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Add Friends</Text>
                </View>

                <View style={styles.searchContainer}>
                    <GlassPanel style={styles.searchPanel}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                            <TextInput 
                                style={styles.searchInput}
                                placeholder="Search for people..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity 
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearButton}
                                >
                                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </GlassPanel>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.loadingText}>Finding people...</Text>
                        </View>
                    ) : error ? (
                        <GlassPanel style={styles.errorPanel}>
                            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                                <Text style={styles.retryText}>Try Again</Text>
                            </TouchableOpacity>
                        </GlassPanel>
                    ) : displayedUsers.length === 0 ? (
                        <GlassPanel style={styles.emptyPanel}>
                            <Ionicons name="people" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyTitle}>
                                {isSearching ? 'No users found' : 'No users yet'}
                            </Text>
                            <Text style={styles.emptyDescription}>
                                {isSearching
                                    ? 'Try adjusting your search terms'
                                    : 'Be the first to invite your friends!'
                                }
                            </Text>
                        </GlassPanel>
                    ) : (
                        <View style={styles.resultsContainer}>
                            {isSearching && (
                                <Text style={styles.resultsHeader}>
                                    {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''} found
                                </Text>
                            )}
                            {displayedUsers.map((userProfile) => (
                                <UserCard 
                                    key={userProfile.id}
                                    profile={userProfile}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
        </RequireAuth>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    safeArea: {
        flex: 1, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16, 
    },
    backButton: {
        padding: 8, 
    },
    headerTitle: {
        flex: 1, 
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40, 
    },
    searchContainer: {
        paddingHorizontal: 20, 
        marginBottom: 16, 
    },
    searchPanel: {
        paddingHorizontal: 16, 
        paddingVertical: 12, 
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1, 
        fontSize: 16, 
        color: '#fff',
        marginLeft: 12, 
        paddingVertical: 4, 
    },
    clearButton: {
        padding: 4, 
    },
    scrollView: {
        flex: 1, 
        paddingHorizontal: 20, 
    }, 
    centerContainer: {
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60, 
    },
    loadingText: {
        fontSize: 16, 
        color: 'rgba(255,255,255,0.8)', 
        marginTop: 12,
    },
    errorPanel: {
        alignItems: 'center',
        paddingVertical: 32, 
    },
    errorText: {
        fontSize: 16, 
        color: '#fff',
        textAlign: 'center',
        marginVertical: 12, 
    },
    retryButton: {
        backgroundColor: Colors.light.primary, 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 20, 
        marginTop: 8, 
    }, 
    retryText: {
        color: "#fff",
        fontSize: 14, 
        fontWeight: '600',
    },
    emptyPanel: {
        alignItems: 'center',
        paddingVertical: 48, 
    },
    emptyTitle: {
        fontSize: 18, 
        fontWeight: '600',
        color: '#fff',
        marginTop: 16, 
        marginBottom: 8, 
    },
    emptyDescription: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 20
    },
    resultsContainer: {
        paddingBottom: 20, 
    },
    resultsHeader: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12, 
        paddingHorizontal: 4, 
    },
});