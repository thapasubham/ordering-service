import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserRepository } from '../repository/user.repository.js';
import { config } from '../config/config.js';
import { RegisterDTO, LoginDTO } from '../types/auth.types.js';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async Register(userData: RegisterDTO) {
    const { email, password, name } = userData;

    const existingUser = await this.userRepository.FindByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: randomUUID(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
    };

    return await this.userRepository.CreateUser(user);
  }

  async Login(credentials: LoginDTO) {
    const { email, password } = credentials;

    const user = await this.userRepository.FindByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET as string,
      {
        expiresIn: '24h',
      }
    );

    return token;
  }

  async VerifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET as string);
      return { valid: true, user: decoded };
    } catch {
      return { valid: false, message: 'Invalid token' };
    }
  }
}
