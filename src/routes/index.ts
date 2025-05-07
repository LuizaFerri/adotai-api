import { Router } from 'express';
import usersRouter from './users.routes';
import institutionsRouter from './institutions.routes';
import authRouter from './auth.routes';

const routes = Router();

routes.use('/users', usersRouter);
routes.use('/institutions', institutionsRouter);
routes.use('/sessions', authRouter);

export default routes; 