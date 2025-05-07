import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const usersRouter = Router();
const userController = new UserController();

// @ts-ignore 
usersRouter.post('/', userController.create.bind(userController));

export default usersRouter; 