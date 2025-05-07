import { Router } from 'express';
import usersRouter from './users.routes';
import institutionsRouter from './institutions.routes';

const routes = Router();

routes.use('/users', usersRouter);
routes.use('/institutions', institutionsRouter);

export default routes; 