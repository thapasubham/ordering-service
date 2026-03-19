import { Db, MongoClient, Document, Collection, ObjectId } from 'mongodb';
import { config } from '../config/config.js';
class MongoDBClient {
  private client!: MongoClient;
  private db!: Db;
  private collection!: Collection;
  async Connect() {
    try {
      this.client = new MongoClient(config.MONGODB_URL);
      await this.client
        .connect()
        .then(() => console.log('Connection to mongodb successfull'));
      this.db = this.client.db('order');
      this.collection = this.db.collection('order');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log('Failed to connect to mongodb', err.message);
      }
    }
  }

  async disconnect() {
    await this.client.close();
    console.log('MongoDB disconnected');
  }
  async health() {
    try {
      this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
  async add<T extends Document>(value: T) {
    const result = await this.collection.insertOne(value);
    return result;
  }

  async get() {
    const result = await this.collection.find().toArray();
    return result;
  }
  async getById(id: string) {
    const result = await this.collection.findOne({ _id: new ObjectId(id) });
    return result;
  }
  async update<T extends Document>(id: string, value: Partial<T>) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: value }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Update failed or no changes made');
    }
    return result;
  }
}

export const mongoDBclient = new MongoDBClient();
