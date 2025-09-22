/**
 * @fileoverview Phone verification modal component
 * Handles PIN-based phone number verification with security features
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Keyboard, Platform } from 'react-native';
import { Button, TextInput, Dialog, Portal, HelperText, Text } from 'react-native-paper';
import { verifyUserPin, formatPhoneNumber } from '@/services/phoneVerificationService';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';

interface PhoneVerificationModalProps {
  visible: boolean;
  phoneNumber: string;
  storeUrl: string;
  onVerificationSuccess: (verifiedPhone: string) => void;
  onVerificationError: (error: string) => void;
  onDismiss: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  visible,
  phoneNumber,
  storeUrl,
  onVerificationSuccess,
  onVerificationError,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(false);
  const [sentPin, setSentPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isVerifyingRef = useRef(false);

  // Security state 
  const [resendCount, setResendCount] = useState(0);
  const [firstResendTs, setFirstResendTs] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setVerifiedPhone } = usePhoneVerification();

  // Constants 
  const MAX_RESENDS_PER_HOUR = 3; 
  const MAX_PIN_ATTEMPTS = 5; 
  const RESEND_COOLDOWN_SECONDS = 45; 
  const HOUR_IN_MS = 60 * 60 * 1000;

  // Hidden input to capture iOS AutoFill (oneTimeCode)
  const hiddenRef = useRef<RNTextInput>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? (Platform.OS === 'ios' ? 300 : 240));
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    
    return () => {
      showSub.remove();
      hideSub.remove();
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0 || cooldownTimerRef.current) return;
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [resendCooldown]);

  // Auto-send PIN when modal opens
  useEffect(() => {
    if (visible && phoneNumber && storeUrl && !sentPin) {
      handleSendPin();
    }
  }, [visible, phoneNumber, storeUrl]);

  const bumpResendCounter = () => {
    const now = Date.now();

    if (!firstResendTs || (now - firstResendTs) >= HOUR_IN_MS) {
      setFirstResendTs(now);
      setResendCount(1);
    } else {
      setResendCount(prev => prev + 1);
    }
  };

  const resetDialogState = () => {
    setOtp(['', '', '', '']);
    setPinError('');
    setSentPin('');
    setPinAttempts(0);
    setIsBlocked(false);
    setResendCount(0);
    setFirstResendTs(null);
    setResendCooldown(0);
    isVerifyingRef.current = false;
  };

  const handleSendPin = async () => {
    try {
      setLoading(true);
      setPinError('');

      // Check resend limits 
      if (resendCount >= MAX_RESENDS_PER_HOUR) {
        setIsBlocked(true);
        setPinError('Too many verification attempts. Please try again later.');
        setLoading(false);
        return; 
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await verifyUserPin(formattedPhone, storeUrl);
      console.log('PIN verification response:', result);

      const pin = String(result?.pin ?? '');
      if (pin) {
        setSentPin(pin);
        bumpResendCounter();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setPinAttempts(0);
        // Focus hidden input so iOS AutoFill drops the full code there
        setTimeout(() => hiddenRef.current?.focus(), 120);
      } else {
        onVerificationError(result?.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending PIN:', error);
      onVerificationError(error instanceof Error ? error.message : 'Failed to send PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleHiddenChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    const arr = [clean[0] ?? '', clean[1] ?? '', clean[2] ?? '', clean[3] ?? ''];
    setOtp(arr);
    setPinError('');

    if (clean.length === 4) {
      Keyboard.dismiss();
      setTimeout(() => handleVerifyPin(clean), 50);
    }
  };

  const handleVerifyPin = async (code?: string) => {
    const pin = (code ?? otp.join('')).trim();

    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    try {
      if (pin.length < 4) {
        setPinError('Please enter the 4-digit code.');
        isVerifyingRef.current = false;
        return;
      }

      // Check attempt limits 
      if (pinAttempts >= MAX_PIN_ATTEMPTS) {
        setIsBlocked(true);
        setPinError('Too many incorrect attempts. Please request a new code.');
        isVerifyingRef.current = false; 
        return; 
      }

      if (pin !== sentPin) {
        const newAttempts = pinAttempts + 1; 
        setPinAttempts(newAttempts);

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          setIsBlocked(true);
          setPinError('Too many incorrect attempts. Please request a new code.');
        } else {
          setPinError(`Invalid code. ${MAX_PIN_ATTEMPTS - newAttempts} attempts remaining.`);
        }
        isVerifyingRef.current = false;
        return;
      }

      // PIN is correct - save verification and notify success
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await setVerifiedPhone(formattedPhone);
      onVerificationSuccess(formattedPhone);
      resetDialogState();
      
    } catch (error) {
      console.error('Error verifying PIN:', error);
      onVerificationError(error instanceof Error ? error.message : 'PIN verification failed');
    } finally {
      isVerifyingRef.current = false;
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) {
      setPinError(`Please wait ${resendCooldown} seconds before requesting a new code.`);
      return;
    }

    // Check time-based resend limits
    const now = Date.now();
    const effectiveResendCount = (!firstResendTs || (now - firstResendTs) >= HOUR_IN_MS) ? 0 : resendCount;
 
    if (effectiveResendCount >= MAX_RESENDS_PER_HOUR) {
      setIsBlocked(true);
      setPinError('Maximum resend limit reached. Please try again later.');
      return; 
    }

    try {
      setLoading(true);
      setPinError('');
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await verifyUserPin(formattedPhone, storeUrl);
      const pin = String(result?.pin ?? '');
      
      if (pin) {
        setSentPin(pin);
        bumpResendCounter();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setPinAttempts(0);
        setOtp(['', '', '', '']);
        setIsBlocked(false);
        hiddenRef.current?.focus();
      } else {
        setPinError(result?.error || 'Failed to resend code.');
      }
    } catch (e) {
      setPinError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    resetDialogState();
    onDismiss();
  };

  // Compute platform-specific keyboard offset
  const dialogOffsetStyle =
    Platform.OS === 'ios' && keyboardHeight
      ? { marginBottom: Math.max(0, keyboardHeight - 24) }
      : null;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        style={[styles.dialog, dialogOffsetStyle]}
        dismissable={!loading}
      >
        <Dialog.Title style={styles.dialogTitle}>
          Verify your phone number
        </Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          <Text style={styles.instructions}>
            We've sent a 4-digit code to {formatPhoneNumber(phoneNumber)}.
          </Text>

          <TextInput
            ref={hiddenRef}
            value={otp.join('')}
            onChangeText={handleHiddenChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            importantForAutofill="yes"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.hiddenInput}
          />

          <View style={styles.otpRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.otpCellBox, otp[i] ? styles.otpCellBoxFilled : null]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={() => hiddenRef.current?.focus()}
              >
                <Text style={styles.otpDigit}>{otp[i]}</Text>
              </View>
            ))}
          </View>

          <HelperText
            type={pinError ? 'error' : 'info'}
            visible={!!pinError || true}
            style={styles.helper}
          >
            {pinError || 'Auto-verifies after 4 digits'}
          </HelperText>

          <Button
            compact
            mode="text"
            onPress={resendCode}
            disabled={loading || resendCooldown > 0 || isBlocked}
            style={styles.resendBtn}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s` 
              : `Resend code (${(!firstResendTs || (Date.now() - firstResendTs) >= HOUR_IN_MS) ? 0 : resendCount}/${MAX_RESENDS_PER_HOUR})`
            }
          </Button>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    marginHorizontal: 20,
    borderRadius: 16,
    maxWidth: 420,
    alignSelf: 'center',
  },
  dialogTitle: {
    textAlign: 'center',
    paddingTop: 14,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '600',
  },
  dialogContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instructions: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  helper: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 0,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  otpCellBox: {
    width: 56,
    height: 56,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  otpCellBoxFilled: {
    borderColor: '#999',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  resendBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
