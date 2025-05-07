import { Request, Response } from 'express';
import { PetStatusService } from '../services/pet-status.service';

// Interface para estender o tipo Request
interface RequestWithUser extends Request {
  user: {
    id: string;
    type: 'user' | 'institution';
  };
}

export class PetStatusController {
  private petStatusService: PetStatusService;

  constructor() {
    this.petStatusService = new PetStatusService();
  }

  async getStatusHistory(req: Request, res: Response) {
    try {
      const { petId } = req.params;
      const history = await this.petStatusService.getPetStatusHistory(petId);
      return res.json(history);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao buscar histórico de status' });
    }
  }

  async getCurrentStatus(req: Request, res: Response) {
    try {
      const { petId } = req.params;
      const currentStatus = await this.petStatusService.getCurrentStatus(petId);
      return res.json(currentStatus);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao buscar status atual' });
    }
  }

  async createStatus(req: Request, res: Response) {
    try {
      const { petId } = req.params;
      const institutionId = (req as RequestWithUser).user.id;
      const { status, description } = req.body;

      const petStatus = await this.petStatusService.createStatus({
        petId,
        institutionId,
        status,
        description
      });

      return res.status(201).json(petStatus);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Erro ao criar status' });
    }
  }
} 