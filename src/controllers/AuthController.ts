import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  async authenticateUser(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    const authService = new AuthService();

    const { user, token } = await authService.authenticateUser({
      email,
      password,
    });

    return res.json({ user, token });
  }

  async authenticateInstitution(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    const authService = new AuthService();

    const { institution, token } = await authService.authenticateInstitution({
      email,
      password,
    });

    return res.json({ institution, token });
  }
} 