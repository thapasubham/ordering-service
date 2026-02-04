export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentRequest = {
  orderId: string;
  amount: number;
  paymentMethod?: string;
};
