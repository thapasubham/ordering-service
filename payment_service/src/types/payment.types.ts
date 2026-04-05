import { ObjectId } from 'mongodb';

export type Payment = {
  _id: ObjectId;
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
