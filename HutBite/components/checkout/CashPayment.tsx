import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Keyboard, Platform } from 'react-native';
import { Button, TextInput, Dialog, Portal, HelperText } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { translate } from '@/constants/translations';
import { verifyUserPin } from '@/services/api';
import { submitOrder, formatOrderData } from '@/services/orderService';
import { useBasketContext } from '@/context/BasketContext';
import { OrderType } from '@/types/store';
import { useStore } from '@/store/StoreContext';

interface CashPaymentProps {
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  onValidateBeforePayment?: () => boolean;
  customerDetails: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  storeUrl: string;
  orderType: OrderType;
  disabled?: boolean;
}

export const CashPayment: React.FC<CashPaymentProps> = ({
  onPaymentSuccess,
  onPaymentError,
  onValidateBeforePayment,
  customerDetails,
  storeUrl,
  orderType,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
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
  const [showFallback, setShowFallback] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Constants 
  const MAX_RESENDS_PER_HOUR = 3; 
  const MAX_PIN_ATTEMPTS = 5; 
  const RESEND_COOLDOWN_SECONDS = 45; 
  const HOUR_IN_MS = 60 * 60 * 1000; // 60 minutes in milliseconds

  const bumpResendCounter = () => {
    const now = Date.now();

    if (!firstResendTs || (now - firstResendTs) >= HOUR_IN_MS) {
      // Reset counter if no previous timepstamp or 60+ minutes have passed 
      setFirstResendTs(now);
      setResendCount(1);
    } else {
      // Increment existing coutner within the hour window 
      setResendCount(prev => prev + 1);
    }
  };

  // Hidden input to capture iOS AutoFill (oneTimeCode)
  const hiddenRef = useRef<RNTextInput>(null);

  const { total, items } = useBasketContext();
  const { storeInfo } = useStore();
  const databaseName =
    (storeInfo as any)?.DeDataSourceName ||
    (storeInfo as any)?.dataBaseName ||
    (storeInfo as any)?.databaseName ||
    'DEFAULT_DB';

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

  const resetDialogState = () => {
    setOtp(['', '', '', '']);
    setPinError('');
    setSentPin('');
    setPinAttempts(0);
    setShowFallback(false);
    isVerifyingRef.current = false;
  };

  const handleSendPin = async () => {
    try {
      setLoading(true);
      setPinError('');

      if (onValidateBeforePayment && !onValidateBeforePayment()) {
        setLoading(false);
        return;
      }

      // Check resend limits 
      if (resendCount >= MAX_RESENDS_PER_HOUR) {
        setIsBlocked(true);
        setShowFallback(true);
        setPinError('Too many verification attempts. Please call the store or use card payment.');
        setLoading(false);
        return; 
      }

      const result = await verifyUserPin(customerDetails.phone, storeUrl);
      console.log('PIN verification response:', result);

      const pin = String(result?.pin ?? result?.deMsgBody ?? result?.DeMsgBody ?? '');
      if (pin) {
        setSentPin(pin);
        bumpResendCounter();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setPinAttempts(0);
        setShowPinDialog(true);
        // Focus hidden input so iOS AutoFill drops the full code there
        setTimeout(() => hiddenRef.current?.focus(), 120);
      } else {
        onPaymentError(result?.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending PIN:', error);
      onPaymentError(error instanceof Error ? error.message : 'Failed to send PIN');
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
      setTimeout(() => handleVerifyPin(clean), 50); // let UI paint last digit
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
        setShowFallback(true);
        setPinError('Too many incorrect attempts. Please request a new code or call the store.');
        isVerifyingRef.current = false; 
        return; 
      }

      if (pin !== sentPin) {
        const newAttempts = pinAttempts + 1; 
        setPinAttempts(newAttempts);

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          setIsBlocked(true);
          setShowFallback(true);
          setPinError('Too many incorrect attempts. Please request a new codde or call the store.');
        } else {
          setPinError(`Invalid code. ${MAX_PIN_ATTEMPTS - newAttempts} attempts remaining.`);
        }
        isVerifyingRef.current = false;
        return;
      }

      console.log('🔍 CASH PAYMENT - Starting order submission');
      console.log('🛒 Basket items count:', items.length);
      console.log('🛒 Basket total:', total);
      console.log('🛒 Basket items detail:', JSON.stringify(items, null, 2));

      if (!items || items.length === 0) {
        console.error('❌ CASH PAYMENT - Basket is empty at order submission');
        onPaymentError('Your basket is empty. Please add items before checkout.');
        isVerifyingRef.current = false;
        return;
      }

      setLoading(true);
      setPinError('');
      Keyboard.dismiss();

      const itemsSnapshot = Array.isArray(items) ? [...items] : [];
      console.log('Submitting order — items count:', itemsSnapshot.length);
      if (!itemsSnapshot.length) {
        setShowPinDialog(false);
        onPaymentError('Your basket is empty.');
        return;
      }

      const paymentDetails = {
        paymentMethod: 'Cash',
        paymentId: `cash_${Date.now()}`,
        amount: `${parseFloat(total).toFixed(2)} EUR`,
      };

      const orderData = formatOrderData(
        itemsSnapshot,
        {
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: customerDetails.address,
          city: customerDetails.city,
          postalCode: customerDetails.postalCode,
        },
        paymentDetails,
        orderType,
        databaseName,
        total
      );

      try {
        const lines = (orderData as any)?.orderLines ?? (orderData as any)?.lines ?? (orderData as any)?.items;
        console.log('Order lines length:', Array.isArray(lines) ? lines.length : 'n/a');
      } catch {}

      const orderResult = await submitOrder(orderData, storeUrl);

      if (orderResult.success) {
        setShowPinDialog(false);
        resetDialogState();
        onPaymentSuccess();
      } else {
        onPaymentError(orderResult.error || 'Order submission failed');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      onPaymentError(error instanceof Error ? error.message : 'PIN verification failed');
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  const handleDismissDialog = () => {
    setShowPinDialog(false);
    resetDialogState();
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
      setShowFallback(true);
      setPinError('Maximum resend limit reached. Please call the store or use card payment.');
      return; 
    }

    try {
      setLoading(true);
      setPinError('');
      const result = await verifyUserPin(customerDetails.phone, storeUrl);
      const pin = String(result?.pin ?? result?.deMsgBody ?? result?.DeMsgBody ?? '');
      if (pin) {
        setSentPin(pin);
        bumpResendCounter();
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setPinAttempts(0);
        setOtp(['', '', '', '']);
        setShowFallback(false);
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

  // Compute platform-specific keyboard offset: apply only on iOS.
  const dialogOffsetStyle =
    Platform.OS === 'ios' && keyboardHeight
      ? { marginBottom: Math.max(0, keyboardHeight - 24) }
      : null;

  return (
    <View style={styles.container} testID="cash-payment">
      <Button
        mode="contained"
        onPress={handleSendPin}
        loading={loading}
        disabled={disabled || loading}
        style={styles.payButton}
        testID="cash-pay-button"
        icon="cash"
      >
        {loading ? translate('processing') : translate('payWithCash')}
      </Button>

      <Portal>
        <Dialog
          visible={showPinDialog}
          onDismiss={handleDismissDialog}
          style={[styles.dialog, dialogOffsetStyle]}
        >
          <Dialog.Title style={styles.dialogTitle}>Verify your phone number</Dialog.Title>

          <Dialog.Content style={styles.dialogContent}>
            <ThemedText style={styles.instructions}>
              We’ve sent a 4-digit code to {customerDetails.phone}.
            </ThemedText>

            {!showFallback ? (
              <>
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
                      <ThemedText style={styles.otpDigit}>{otp[i]}</ThemedText>
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
                    : `${translate('resend') || 'Resend code'} (${(!firstResendTs || (Date.now() - firstResendTs) >= HOUR_IN_MS) ? 0 : resendCount}/${MAX_RESENDS_PER_HOUR})`
                  }
                </Button>
              </>
            ) : (
              <View style={styles.fallbackContainer}>
                <ThemedText style={styles.fallbackText}>
                  Too many attempts. Please choose an alternative:
                </ThemedText>
 
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowPinDialog(false);
                    // Switch to card payment - you may need to implement this callback
                    onPaymentError('SWITCH_TO_CARD');
                  }}
                  style={styles.fallbackButton}
                  icon="credit-card"
                >
                  {translate('payWithCard')}
                </Button>
 
                <Button
                  mode="outlined"
                  onPress={() => {
                    // Call store functionality - you may need to implement this
                    setShowPinDialog(false);
                    onPaymentError('CALL_STORE');
                  }}
                  style={styles.fallbackButton}
                  icon="phone"
                >
                  {translate('callStore')}
                </Button>
              </View>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  payButton: { height: 48, justifyContent: 'center', borderRadius: 10 },

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

  // Hidden input: technically present so iOS considers it for AutoFill,
  // but visually invisible and out of the way.
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
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  fallbackText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
    color: '#666',
  },
  fallbackButton: {
    width: '100%',
    marginBottom: 8,
  },
});
