import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
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
          backgroundColor: colors.primary,
          marginBottom: 100, // Above bottom navigation
        }}
        theme={{
          colors: {
            surface: colors.primary,
            onSurface: '#fff',
          },
        }}
      >
        {message}
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
