export const config = {
  MONGODB_URL:
    process.env.MONGODB_URL ||
    'mongodb://username:password@localhost:27017/myproject',
  MONGODB_DB: process.env.MONGODB_DB || 'order',
  MONGODB_COLLECTION: process.env.MONGODB_COLLECTION || 'order',
};
