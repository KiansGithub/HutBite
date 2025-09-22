import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocation';
import { usePostcode } from '@/contexts/PostcodeContext';
import { reverseGeocodeToPostcode, validateUKPostcode, formatUKPostcode } from '@/services/postcodeService';

const { width, height } = Dimensions.get('window');

interface PostcodeOnboardingProps {
  onComplete: () => void;
}

export const PostcodeOnboarding: React.FC<PostcodeOnboardingProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const { setPostcode, completeOnboarding } = usePostcode();
  
  const [step, setStep] = useState<'welcome' | 'location' | 'manual'>('welcome');
  const [manualPostcode, setManualPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedPostcode, setDetectedPostcode] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Animate in on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-detect postcode when location is available
  useEffect(() => {
    if (location && step === 'location') {
      handleLocationDetection();
    }
  }, [location, step]);

  const handleLocationDetection = async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      const result = await reverseGeocodeToPostcode(location);
      
      if (result.postcode) {
        setDetectedPostcode(result.postcode);
        console.log('Detected postcode:', result.postcode);
      } else {
        console.warn('Could not detect postcode:', result.error);
        // Auto-fallback to manual entry
        setStep('manual');
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setStep('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (locationError) {
      Alert.alert(
        'Location Access Required',
        'Please enable location services in your device settings to automatically detect your postcode.',
        [
          { text: 'Enter Manually', onPress: () => setStep('manual') },
          { text: 'Try Again', onPress: () => setStep('location') },
        ]
      );
      return;
    }
    
    setStep('location');
  };

  const handleManualEntry = () => {
    setStep('manual');
  };

  const handleConfirmPostcode = async (postcode: string) => {
    if (!validateUKPostcode(postcode)) {
      Alert.alert('Invalid Postcode', 'Please enter a valid UK postcode (e.g., SW1A 1AA)');
      return;
    }

    setLoading(true);
    try {
      const formattedPostcode = formatUKPostcode(postcode);
      await setPostcode(formattedPostcode);
      await completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Error saving postcode:', error);
      Alert.alert('Error', 'Failed to save postcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualPostcode.trim()) {
      Alert.alert('Postcode Required', 'Please enter your postcode to continue.');
      return;
    }
    
    handleConfirmPostcode(manualPostcode.trim());
  };

  const renderWelcomeStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={80} color={Colors.light.primary} />
      </View>
      
      <Text style={styles.title}>Welcome to HutBite!</Text>
      <Text style={styles.subtitle}>
        To show you the best restaurants and delivery options in your area, we need your postcode.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleUseLocation}
          disabled={loading}
        >
          <Ionicons name="location-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Use My Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleManualEntry}
        >
          <Ionicons name="create-outline" size={20} color={Colors.light.primary} style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderLocationStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        {loading || locationLoading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : detectedPostcode ? (
          <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
        ) : (
          <Ionicons name="location" size={80} color={Colors.light.primary} />
        )}
      </View>
      
      {detectedPostcode ? (
        <>
          <Text style={styles.title}>Postcode Detected!</Text>
          <Text style={styles.subtitle}>
            We found your postcode: <Text style={styles.postcodeText}>{detectedPostcode}</Text>
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={() => handleConfirmPostcode(detectedPostcode)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Confirm</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep('manual')}
            >
              <Text style={styles.secondaryButtonText}>Enter Different Postcode</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Detecting Your Location...</Text>
          <Text style={styles.subtitle}>
            Please wait while we find your postcode automatically.
          </Text>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('manual')}
          >
            <Text style={styles.secondaryButtonText}>Enter Manually Instead</Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );

  const renderManualStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="create" size={80} color={Colors.light.primary} />
      </View>
      
      <Text style={styles.title}>Enter Your Postcode</Text>
      <Text style={styles.subtitle}>
        Please enter your UK postcode to find restaurants in your area.
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g., SW1A 1AA"
          value={manualPostcode}
          onChangeText={setManualPostcode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          returnKeyType="done"
          onSubmitEditing={handleManualSubmit}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleManualSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Continue</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStep('welcome')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        {step === 'welcome' && renderWelcomeStep()}
        {step === 'location' && renderLocationStep()}
        {step === 'manual' && renderManualStep()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  postcodeText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
