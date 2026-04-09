import { Db, MongoClient, Document, Collection } from 'mongodb';
import { config } from '../config/config.js';

class MongoDBClient {
  private client!: MongoClient;
  private db!: Db;
  private collection!: Collection;

  async Connect() {
    try {
      this.client = new MongoClient(config.MONGODB_URL);
      await this.client.connect();
      console.log('Connection to mongodb successful (user-auth)');
      this.db = this.client.db('user-auth');
      this.collection = this.db.collection('users');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log('Failed to connect to mongodb', err.message);
      }
    }
  }

  async health() {
    try {
      await this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  async addUser<T extends Document>(user: T) {
    return await this.collection.insertOne(user);
  }

  async findUserByEmail(email: string) {
    return await this.collection.findOne({ email });
  }

  async findUserById(id: string) {
    return await this.collection.findOne({ id });
  }
}

export const mongoDBclient = new MongoDBClient();
