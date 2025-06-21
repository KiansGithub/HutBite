import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const { signIn, signUp } = useAuthStore();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        const { error } = isSignUp 
            ? await signUp(email, password)
            : await signIn(email, password);
        
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(main)/feed');
        }

        setLoading(false);
    };

    return(
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding': 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>LoveBites</Text>
                <Text style={styles.subtitle}>Discover amazing food</Text>

                <View style={styles.form}>
                    <TextInput 
                      style={styles.input}
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />

                    <TextInput 
                      style={styles.input}
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry 
                      placeholderTextColor="#999"
                    />

                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleAuth}
                      disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.switchButton}
                      onPress={() => setIsSignUp(!isSignUp)}
                    >
                        <Text style={styles.switchText}>
                            {isSignUp ? 'Already have an account? Sign In': "Don't have an account? Sign Up"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#fff'
    },
    content: {
        flex: 1, 
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 48, 
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8, 
        backgroundColor: 'linear-gradient(45deg, #FF6B35, #FF8E53)',
        color: '#FF6B35'
    },
    subtitle: {
        fontSize: 18, 
        textAlign: 'center',
        color: '#666',
        marginBottom: 48, 
    },
    form: {
        gap: 16, 
    },
    input: {
        borderWidth: 1, 
        borderColor: '#ddd',
        borderRadius: 12, 
        padding: 16, 
        fontSize: 16, 
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#FF6B35',
        borderRadius: 12, 
        padding: 16, 
        alignItems: 'center',
        marginTop: 8, 
    },
    buttonText: {
        color: '#fff',
        fontSize: 18, 
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    switchText: {
        color: '#FF6B35',
        fontSize: 16,
    },
});