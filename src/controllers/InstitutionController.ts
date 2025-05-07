import { Request, Response } from 'express';
import { InstitutionService } from '../services/InstitutionService';

export class InstitutionController {
  async create(req: Request, res: Response): Promise<Response> {
    const {
      name,
      email,
      cnpj,
      password,
      responsibleName,
      type,
      city,
      state,
      zipCode,
      address,
      latitude,
      longitude
    } = req.body;

    const institutionService = new InstitutionService();

    const institution = await institutionService.create({
      name,
      email,
      cnpj,
      password,
      responsibleName,
      type,
      city,
      state,
      zipCode,
      address,
      latitude,
      longitude
    });

    return res.status(201).json(institution);
  }
} 