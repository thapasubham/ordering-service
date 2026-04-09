import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3003,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key_change_this_later',
};
