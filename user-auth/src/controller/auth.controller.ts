import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async Register(req: Request, res: Response) {
    try {
      const result = await this.authService.Register(req.body);
      res
        .status(201)
        .json({
          message: 'User registered successfully',
          userId: result.insertedId,
        });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ message });
    }
  }

  async Login(req: Request, res: Response) {
    try {
      const token = await this.authService.Login(req.body);
      res.status(200).json({ token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(401).json({ message });
    }
  }

  async Verify(req: Request, res: Response) {
    console.log(req);
    const authHeader = req.headers.authorization;
    console.log(req.headers);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Invalid token format');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    const result = await this.authService.VerifyToken(token);

    if (result.valid) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  }
}
