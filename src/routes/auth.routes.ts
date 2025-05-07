import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const authRouter = Router();
const authController = new AuthController();

// @ts-ignore - Ignorar erro de tipagem
authRouter.post('/users', authController.authenticateUser.bind(authController));

// @ts-ignore - Ignorar erro de tipagem
authRouter.post('/institutions', authController.authenticateInstitution.bind(authController));

export default authRouter; 