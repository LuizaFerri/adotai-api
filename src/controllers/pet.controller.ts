import { Request, Response } from 'express';
import { PetService } from '../services/pet.service';
import { PetStatusService } from '../services/pet-status.service';
import { PrismaClient } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    id: string;
    type: 'user' | 'institution';
  };
}

export class PetController {
  private petService: PetService;
  private petStatusService: PetStatusService;
  private prisma: PrismaClient;

  constructor() {
    this.petService = new PetService();
    this.petStatusService = new PetStatusService();
    this.prisma = new PrismaClient();
  }

  async create(req: Request, res: Response) {
    try {
      const institutionId = (req as RequestWithUser).user.id;
      console.log('ID da instituição (controller):', institutionId);
      
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId }
      });
      
      if (!institution) {
        console.error('Instituição não encontrada no banco de dados');
        return res.status(400).json({ error: 'Instituição não encontrada' });
      }
      
      
      const petData = {
        ...req.body,
      };

      
      const pet = await this.petService.create(petData, institutionId);
      return res.status(201).json(pet);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erro ao criar pet:', error.message);
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro desconhecido ao criar pet:', error);
      return res.status(400).json({ error: 'Erro ao criar pet' });
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { 
        page = '1', 
        limit = '10', 
        species, 
        size, 
        gender, 
        isAvailable 
      } = req.query;

      const pets = await this.petService.findAll({
        page: Number(page),
        limit: Number(limit),
        species: species as string,
        size: size as string,
        gender: gender as string,
        isAvailable: isAvailable === 'true'
      });
      
      return res.json(pets);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao buscar pets' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pet = await this.petService.findById(id);

      if (!pet) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }

      return res.json(pet);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(404).json({ error: 'Erro ao buscar pet' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const institutionId = (req as RequestWithUser).user.id;
      const petData = req.body;

      const pet = await this.petService.update(id, petData, institutionId);
      return res.json(pet);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao atualizar pet' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const institutionId = (req as RequestWithUser).user.id;

      await this.petService.delete(id, institutionId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao deletar pet' });
    }
  }
} 