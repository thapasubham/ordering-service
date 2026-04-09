import { ObjectId } from 'mongodb';

export type Order = {
  _id: ObjectId;
  price: number;
  name: string;
  Status: 'pending' | 'success' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};
