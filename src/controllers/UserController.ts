import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  async create(req: Request, res: Response): Promise<Response> {
    const { name, email, cpf, password, city, state, zipCode, address } = req.body;

    const userService = new UserService();

    const user = await userService.create({
      name,
      email,
      cpf,
      password,
      city,
      state,
      zipCode,
      address,
    });

    return res.status(201).json(user);
  }
} 