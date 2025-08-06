import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthGate } from "@/hooks/useAuthGate";
import { GlassPanel } from "@/components/GlassPanel";

export const RequireAuth: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const { isAuthed, ensureAuthed } = useAuthGate();

    if (isAuthed) return <>{children}</>;

    return (
        <LinearGradient 
          colors={['#FF512F', '#F09819', '#FFB347']}
          start={{ x: 0, y: 0}}
          end={{ x: 1, y: 1}}
          style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <GlassPanel style={styles.panel}>
            <Ionicons name="lock-closed" size={48} color="rgba(255,255,255,0.7)" />
            <Text style={styles.title}>Sign in Required</Text>
            <Text style={styles.subtitle}>
              Sign in to access this feature and personalize your experience
            </Text>
            <TouchableOpacity
              onPress={() => ensureAuthed()}
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      </SafeAreaView>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    safeArea: {
        flex: 1, 
    },
    content: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24, 
    },
    panel: {
        alignItems: 'center',
        paddingVertical: 32, 
    },
    title: {
        color: '#fff',
        fontSize: 20, 
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 16, 
        marginBottom: 8, 
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16, 
        textAlign: 'center',
        lineHeight: 22, 
        marginBottom: 24, 
    },
    signInButton: {
        paddingVertical: 12, 
        paddingHorizontal: 24, 
        borderRadius: 25, 
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    signInButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16, 
    },
});