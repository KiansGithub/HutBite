import { OrderType } from './store';

export interface OrderCustomerDetails {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
}

export interface OrderPaymentDetails {
    paymentId: string;
    paymentMethod: string;
    amount: string;
}

export interface OrderSubmissionResponse {
    success: boolean;
    orderId?: string;
    error?: string;
}
