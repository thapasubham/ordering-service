export type Order = {
  id: string;
  price: number;
  name: string;
  Status: 'pending' | 'success' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};
