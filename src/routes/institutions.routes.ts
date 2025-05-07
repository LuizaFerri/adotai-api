import { Router } from 'express';
import { InstitutionController } from '../controllers/InstitutionController';

const institutionsRouter = Router();
const institutionController = new InstitutionController();

// @ts-ignore 
institutionsRouter.post('/', institutionController.create.bind(institutionController));

export default institutionsRouter; 