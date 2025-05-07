import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PetStatusController } from '../controllers/pet-status.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const petStatusController = new PetStatusController();

router.get('/:petId/history', (async (req: Request, res: Response) => {
  await petStatusController.getStatusHistory(req, res);
}) as RequestHandler);

router.get('/:petId/current', (async (req: Request, res: Response) => {
  await petStatusController.getCurrentStatus(req, res);
}) as RequestHandler);

router.post('/:petId', 
  authMiddleware as RequestHandler,
  (async (req: Request, res: Response) => {
    await petStatusController.createStatus(req, res);
  }) as RequestHandler
);

export default router; 