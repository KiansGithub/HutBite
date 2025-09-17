import { Alert } from 'react-native';

/**
 * Types for error handling functions 
 */
interface ErrorHandlingOptions {
    storePhone?: string; 
    storeName?: string; 
    postcode?: string; 
    errorCode?: string; 
}

type ErrorType = 
  | 'STORE_NOT_FOUND'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_ERROR'
  | 'ORDER_SUBMISSION_ERROR'
  | 'ORDER_VALIDATION_ERROR'
  | 'BASKET_ERROR'
  | 'CUSTOMER_DATA_ERROR'

/**
 * Default error messages in German
 */
const ERROR_MESSAGES = {
  STORE_NOT_FOUND: 'Wir konnten kein Geschäft für die eingegebene Postleitzahl finden.',
  API_ERROR: 'Es ist ein technischer Fehler aufgetreten.',
  NETWORK_ERROR: 'Bitte überprüfen Sie Ihre Internetverbindung.',
  VALIDATION_ERROR: 'Bitte überprüfen Sie Ihre Eingaben.',
  PAYMENT_ERROR: 'Bei der Zahlung ist ein Fehler aufgetreten.',
  ORDER_SUBMISSION_ERROR: 'Die Bestellung konnte nicht übermittelt werden.',
  ORDER_VALIDATION_ERROR: 'Die Bestelldaten sind unvollständig oder fehlerhaft.',
  BASKET_ERROR: 'Es gab ein Problem mit Ihrem Warenkorb.',
  CUSTOMER_DATA_ERROR: 'Die Kundendaten sind unvollständig oder fehlerhaft.',
} as const; 

/**
 * Formats contact information for error messages 
 */
const formatContactInfo = (options?: ErrorHandlingOptions): string => {
    if (options?.storePhone) {
        return `\n\nBitte kontaktieren Sie uns unter: ${options.storePhone}`;
    }
    return '\n\nBitte versuchen Sie es später erneut.';
};

/**
 * Shows an error alert with consistent formatting 
 */
export const showErrorAlert = (
    title: string, 
    message: string, 
    options?: ErrorHandlingOptions
) : void => {
    Alert.alert(
        title, 
        message + formatContactInfo(options),
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
    );
};

/**
 * Handles specific error types with predefined messages 
 */
export const handleError = (
    type: ErrorType, 
    options?: ErrorHandlingOptions
): void => {
    const title = 'Es ist ein Fehler aufgetreten';
    const message = ERROR_MESSAGES[type];
    showErrorAlert(title, message, options);
};

/**
 * Handles store-related errors 
 */
export const handleStoreError = (
    error: unknown, 
    options?: ErrorHandlingOptions 
): void => {
    if (error instanceof Error) {
        console.error('Store error:', error);

        if (error.message.includes('not found')) {
            handleError('STORE_NOT_FOUND', options);
        } else if (error.message.includes('network')) {
            handleError('NETWORK_ERROR', options);
        } else {
            handleError('API_ERROR', options);
        }
    } else {
        console.error('Unkown error:', error);
        handleError('API_ERROR', options);
    }
};

/**
 * Formats error messages specifcially for store context display 
 * Returns a user-friendly error message string in German
 */
export const formatStoreContextError = (error: Error): string => {
    // Handle specific error types 
    if (error.message.includes('not found')) {
        return ERROR_MESSAGES.STORE_NOT_FOUND;
    }

    if (error.message.includes('network')) {
        return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (error.message.includes('validation')) {
        return ERROR_MESSAGES.VALIDATION_ERROR;
    }

    return ERROR_MESSAGES.API_ERROR;
}

/**
 * Handles order submission errors with specific error types 
 */
export const handleOrderSubmissionError = (
    error: unknown, 
    options?: ErrorHandlingOptions
): string => {
    console.error('Order submission order:', error);

    if (error instanceof Error) {
        // Check for specific error patterns 
        if (error.message.includes('network') || error.message.includes('fetch')) {
            handleError('NETWORK_ERROR', options);
            return ERROR_MESSAGES.NETWORK_ERROR; 
        }

        if (error.message.includes('validation') || error.message.includes('required')) {
            handleError('ORDER_VALIDATION_ERROR', options);
            return ERROR_MESSAGES.ORDER_VALIDATION_ERROR; 
        }

        if (error.message.includes('validation') || error.message.includes('required')) {
            handleError('ORDER_VALIDATION_ERROR', options);
            return ERROR_MESSAGES.PAYMENT_ERROR;
        }

        if (error.message.includes('payment')) {
            handleError('PAYMENT_ERROR', options);
            return ERROR_MESSAGES.PAYMENT_ERROR;
        }

        if (error.message.includes('basket') || error.message.includes('cart')) {
            handleError('BASKET_ERROR', options);
            return ERROR_MESSAGES.BASKET_ERROR; 
        }

        if (error.message.includes('customer')) {
            handleError('CUSTOMER_DATA_ERROR', options);
            return ERROR_MESSAGES.CUSTOMER_DATA_ERROR; 
        }
    }

    // Default to order submission error 
    handleError('ORDER_SUBMISSION_ERROR', options);
    return ERROR_MESSAGES.ORDER_SUBMISSION_ERROR; 
};

/**
 * Handles payment-specific errors 
 */
export const handlePaymentError = (
    error: unknown, 
    options?: ErrorHandlingOptions
): string => {
    console.error('Payment error:', error);

    if (error instanceof Error) {
        if (error.message.includes('declined') || error.message.includes('insufficient')) {
            const message = 'Ihre Zahlung wurde abgelehnt. Bitte überprüfen Sie Ihre Zahlungsdaten.'; 
            showErrorAlert('Zahlung fehlgeschlagen', message, options);
            return message; 
        }

        if (error.message.includes('network')) {
            handleError('NETWORK_ERROR', options);
            return ERROR_MESSAGES.NETWORK_ERROR; 
        }
    }

    handleError('PAYMENT_ERROR', options);
    return ERROR_MESSAGES.PAYMENT_ERROR; 
};

/**
 * Validates order data and returns specific error messages 
 */
export const validateOrderData = (orderData: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check for items in the correct location - they are nested in new_state
    if (!orderData.new_state?.items || orderData.new_state.items.length === 0) {
        errors.push('Warenkorb ist leer');
    }

    if (!orderData.new_state?.customer?.email) {
        errors.push('E-Mail-Adresse ist erforderlich');
    }

    if (!orderData.new_state?.customer.first_name) {
        errors.push('Vorname ist erforderlich');
    }

    if (!orderData.new_state?.customer?.last_name) {
        errors.push('Nachname ist erforderlich');
    }

    if (!orderData.new_state?.customer?.phone) {
        errors.push('Telefonnummer ist erforderlich');
    }

    if (orderData.new_state?.service_type === 'delivery') {
        if (!orderData.new_state?.customer?.address_1) {
            errors.push('Lieferadresse ist erforderlich');
        }
        if (!orderData.new_state?.customer?.postal_code) {
            errors.push('Postleitzahl ist erforderlich');
        }
        if (!orderData.new_state?.customer?.city) {
            errors.push('Stadt ist erforderlich');
        }
    }

    return {
        isValid: errors.length === 0, 
        errors
    };
};

export default { showErrorAlert, handleError, handleStoreError };