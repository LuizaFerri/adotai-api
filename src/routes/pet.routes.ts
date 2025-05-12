import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PetController } from '../controllers/pet.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { petPhotosUpload } from '../middlewares/upload.middleware';

const router = Router();
const petController = new PetController();

router.get('/', (async (req: Request, res: Response) => {
  await petController.findAll(req, res);
}) as RequestHandler);

router.get('/:id', (async (req: Request, res: Response) => {
  await petController.findById(req, res);
}) as RequestHandler);

router.post('/', 
  authMiddleware as RequestHandler,
  (req: Request, res: Response, next: NextFunction) => {
    petPhotosUpload(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (async (req: Request, res: Response) => {
    await petController.create(req, res);
  }) as RequestHandler
);

router.put('/:id', 
  authMiddleware as RequestHandler,
  (req: Request, res: Response, next: NextFunction) => {
    petPhotosUpload(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (async (req: Request, res: Response) => {
    await petController.update(req, res);
  }) as RequestHandler
);

router.delete('/:id', 
  authMiddleware as RequestHandler,
  (async (req: Request, res: Response) => {
    await petController.delete(req, res);
  }) as RequestHandler
);

export default router; 