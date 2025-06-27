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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useAuthStore } from "@/store/authStore";
import Colors from "@/constants/Colors";
import { GradientText } from "@/components/GradientText";
import { GlassPanel } from "@/components/GlassPanel";
// import AnalyticsService from "@/lib/analytics";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn, signUp } = useAuthStore();

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
      router.replace("/(main)/feed");
    }

    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#FF512F", "#F09819", "#FFB347"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative bokeh */}
      <LinearGradient
        colors={["rgba(255,255,255,0.25)", "transparent"]}
        style={styles.bokehOne}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.15)", "transparent"]}
        style={styles.bokehTwo}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.wrapper}>
          <GlassPanel>
            {/* Header */}
            <Text style={styles.title}>Welcome to LiveBites</Text>
            <Text style={styles.subtitle}>Your culinary adventure awaits</Text>

            {/* OAUTH buttons – same width */}
            {/* <TouchableOpacity activeOpacity={0.9} style={styles.oauthBtn}>
              <Text style={styles.oauthText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.oauthBtn}>
              <Text style={styles.oauthText}>Continue with Apple</Text>
            </TouchableOpacity>

            <Text style={styles.dividerText}>OR CONTINUE WITH EMAIL</Text> */}

            {/* Sign-in / Sign-up segmented */}
            <View style={styles.segmentedWrapper}>
              <TouchableOpacity
                style={[styles.segmentedBtn, !isSignUp && styles.segmentedSelected]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.segmentedText, !isSignUp && styles.segmentedTextSelected]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentedBtn, isSignUp && styles.segmentedSelected]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.segmentedText, isSignUp && styles.segmentedTextSelected]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.authBtn, loading && styles.btnDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authBtnText}>{isSignUp ? "Sign Up to LiveBites" : "Sign In to LiveBites"}</Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={styles.legal}>
              By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </GlassPanel>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    color: "#fff"
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
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
    color: "rgba(255,255,255,0.65)",
    alignSelf: "center",
    marginVertical: 16,
  },
  segmentedWrapper: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  segmentedSelected: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  segmentedText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  segmentedTextSelected: { color: "#fff" },
  label: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    height: 46,
    fontSize: 16,
    color: "#fff",
  },
  authBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
    shadowColor: "#FF774B",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  btnDisabled: { opacity: 0.7 },
  authBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  legal: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
    color: "#fff",
  },
  bokehOne: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -60,
    left: -40,
    opacity: 0.35,
    transform: [{ rotate: "45deg" }],
  },
  bokehTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -40,
    right: -50,
    opacity: 0.25,
    transform: [{ rotate: "-20deg" }],
  },
});