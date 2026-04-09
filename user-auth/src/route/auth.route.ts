import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { AuthService } from '../service/auth.service.js';
import { UserRepository } from '../repository/user.repository.js';

const route = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

route.post('/register', authController.Register.bind(authController));
route.post('/login', authController.Login.bind(authController));
route.get('/verify', authController.Verify.bind(authController));

export const authRoute = route;
