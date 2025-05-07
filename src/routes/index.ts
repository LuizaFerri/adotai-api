import { Router } from 'express';
import usersRouter from './users.routes';
import institutionsRouter from './institutions.routes';
import authRouter from './auth.routes';
import petsRouter from './pet.routes';
import petStatusRouter from './pet-status.routes';

const routes = Router();

routes.use('/users', usersRouter);
routes.use('/institutions', institutionsRouter);
routes.use('/sessions', authRouter);
routes.use('/pets', petsRouter);
routes.use('/pet-status', petStatusRouter);

export default routes; 