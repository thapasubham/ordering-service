import { mongoDBclient } from '../client/mongoDB.client.js';
import { Document } from 'mongodb';

export class UserRepository {
  async FindByEmail(email: string) {
    return await mongoDBclient.findUserByEmail(email);
  }

  async FindById(id: string) {
    return await mongoDBclient.findUserById(id);
  }

  async CreateUser<T extends Document>(user: T) {
    return await mongoDBclient.addUser(user);
  }
}
