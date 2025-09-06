import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
  Text
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import Colors from "@/constants/Colors";
import { GradientText } from "@/components/GradientText";
import { GlassPanel } from "@/components/GlassPanel";
import { GoogleSignInButton, AppleSignInButton } from "@/components/OAuthButtons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/components/useColorScheme";
import { useLocalSearchParams, router } from "expo-router";

const dynamicStyles = (themeColors) => StyleSheet.create({
  title: {
    color: themeColors.text,
  },
  subtitle: {
    color: themeColors.text,
    opacity: 0.85,
  },
  dividerText: {
    color: themeColors.text,
    opacity: 0.65,
  },
  segmentedWrapper: {
    borderColor: 'rgba(0,0,0,0.1)',
  },
  segmentedSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  segmentedText: {
    color: themeColors.text,
    opacity: 0.7,
  },
  segmentedTextSelected: {
    color: themeColors.text,
  },
  label: {
    color: themeColors.text,
    opacity: 0.85,
  },
  inputWrapper: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d0d0d0',
  },
  input: {
    color: themeColors.text,
  },
  legal: {
    color: themeColors.text,
    opacity: 0.65,
  },
  link: {
    color: themeColors.primary,
  },
  guestBtn: {
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  guestBtnText: {
    color: themeColors.text,
  },
});

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { next } = useLocalSearchParams<{ next?: string }>();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];
  const styles = { ...staticStyles, ...dynamicStyles(themeColors) };

  const insets = useSafeAreaInsets();

  const { signIn, signUp, signInWithProvider } = useAuthStore();

  React.useEffect(() => {
    // AnalyticsService.logScreenView('SignIn', 'AuthScreen');
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace(next || '/(main)/feed');
    }

    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const { error } = await signInWithProvider(provider);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace(next || '/(main)/feed');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.wrapper}>
            <GlassPanel>
              {/* Header */}
              <Text style={[staticStyles.title, styles.title]}>Welcome to HutBite</Text>
              <Text style={[staticStyles.subtitle, styles.subtitle]}>Your culinary adventure awaits</Text>
              {/* OAUTH buttons – same width */}
              <GoogleSignInButton
                onPress={() => handleOAuth('google')}
                loading={loading}
              />
              <AppleSignInButton
                onPress={() => handleOAuth('apple')}
                loading={loading}
              />

              <TouchableOpacity
                style={[staticStyles.guestBtn, styles.guestBtn, loading && staticStyles.btnDisabled]}
                onPress={() => router.replace('/(main)/feed')}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                accessibilityHint="Skips sign-in and takes you to the feed"
              >
                <Text style={[staticStyles.guestBtnText, styles.guestBtnText]}>Continue as guest</Text>
              </TouchableOpacity>

              <Text style={[staticStyles.dividerText, styles.dividerText]}>OR CONTINUE WITH EMAIL</Text>

              {/* Sign-in / Sign-up segmented */}
              <View style={[staticStyles.segmentedWrapper, styles.segmentedWrapper]}>
                <TouchableOpacity
                  style={[staticStyles.segmentedBtn, !isSignUp && styles.segmentedSelected]}
                  onPress={() => setIsSignUp(false)}
                >
                  <Text style={[staticStyles.segmentedText, !isSignUp && styles.segmentedTextSelected]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[staticStyles.segmentedBtn, isSignUp && styles.segmentedSelected]}
                  onPress={() => setIsSignUp(true)}
                >
                  <Text style={[staticStyles.segmentedText, isSignUp && styles.segmentedTextSelected]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <Text style={[staticStyles.label, styles.label]}>Email</Text>
              <View style={[staticStyles.inputWrapper, styles.inputWrapper]}>
                <TextInput
                  style={[staticStyles.input, styles.input]}
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <Text style={[staticStyles.label, styles.label]}>Password</Text>
              <View style={[staticStyles.inputWrapper, styles.inputWrapper]}>
                <TextInput
                  style={[staticStyles.input, styles.input]}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[staticStyles.authBtn, loading && staticStyles.btnDisabled]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={staticStyles.authBtnText}>{isSignUp ? "Sign Up to HutBite" : "Sign In to HutBite"}</Text>
                )}
              </TouchableOpacity>

              {/* Legal */}
              <Text style={[staticStyles.legal, styles.legal]}>
                By continuing, you agree to our <Text style={[staticStyles.link, styles.link]}>Terms of Service</Text> and <Text style={[staticStyles.link, styles.link]}>Privacy Policy</Text>
              </Text>
            </GlassPanel>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  kav: { flex: 1 },
  wrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  oauthBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  oauthText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  dividerText: {
    fontSize: 12,
    alignSelf: "center",
    marginVertical: 16,
  },
  segmentedWrapper: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  segmentedSelected: {},
  segmentedText: {
    fontSize: 15,
    fontWeight: "500",
  },
  segmentedTextSelected: {},
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    height: 46,
    fontSize: 16,
  },
  authBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  btnDisabled: { opacity: 0.7 },
  authBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  legal: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
  },
  guestLink: {
    alignSelf: 'center',
    paddingVertical: 0,       // keeps a decent tap target without looking like a button
    paddingHorizontal: 12,
    marginTop: 0,
    marginBottom: 12,
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline', // optional: comment out if you don't want the link look
  },
  guestBtn: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 14,         // ≥44px target with line height/text
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});