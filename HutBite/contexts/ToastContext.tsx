import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { Text } from 'react-native';
import Colors from '@/constants/Colors';

const colors = Colors.light;

interface ToastContextValue {
  showToast: (message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(3000);

  const showToast = (toastMessage: string, toastDuration: number = 3000) => {
    setMessage(toastMessage);
    setDuration(toastDuration);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  const value: ToastContextValue = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideToast}
        duration={duration}
        style={{
          backgroundColor: '#10B981', // Modern success green
          marginBottom: 100, // Above bottom navigation
          borderRadius: 12, // More modern rounded corners
          elevation: 8, // Better shadow on Android
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
        theme={{
          colors: {
            surface: '#10B981', // Success green
            onSurface: '#FFFFFF', // Clean white text
          },
        }}
        contentStyle={{
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: 0.3,
        }}
      >
        <Text style={{ color: '#FFFFFF' }}>{message}</Text>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
