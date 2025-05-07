import request from 'supertest';
import express from 'express';
import { InstitutionService } from '../../services/InstitutionService';
import { InstitutionController } from '../../controllers/InstitutionController';
import { AppError } from '../../utils/AppError';
import { errorHandler } from '../../middlewares/error';

jest.mock('../../services/InstitutionService');

describe('InstitutionController', () => {
  let app: express.Application;
  let mockInstitutionService: jest.Mocked<InstitutionService>;
  
  const mockInstitutionData = {
    name: 'Test NGO',
    email: 'ngo@email.com',
    cnpj: '12345678000100',
    password: 'password456',
    responsibleName: 'Responsible Person',
    type: 'ONG',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 456',
    latitude: undefined,
    longitude: undefined,
  };

  const mockInstitutionResponse = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    name: 'Test NGO',
    email: 'ngo@email.com',
    cnpj: '12345678000100',
    type: 'ONG',
    responsibleName: 'Responsible Person',
    city: 'New York',
    state: 'NY',
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockInstitutionService = new InstitutionService() as jest.Mocked<InstitutionService>;
    
    mockInstitutionService.create = jest.fn();
    
    const institutionController = new InstitutionController();
    app.post('/institutions', async (req, res, next) => {
      try {
        await institutionController.create(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler(err, req, res, next);
    });
    
    (InstitutionService as jest.Mock).mockImplementation(() => mockInstitutionService);
  });

  describe('POST /institutions', () => {
    it('should create an institution and return 201', async () => {
      mockInstitutionService.create.mockResolvedValue(mockInstitutionResponse);

      const response = await request(app)
        .post('/institutions')
        .send(mockInstitutionData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(mockInstitutionService.create).toHaveBeenCalledWith(mockInstitutionData);
      expect(response.body).toEqual(mockInstitutionResponse);
    });

    it('should return appropriate error when email or CNPJ is already registered', async () => {
      const errorMessage = 'E-mail ou CNPJ já cadastrado';
      mockInstitutionService.create.mockRejectedValue(
        new AppError(errorMessage)
      );

      const response = await request(app)
        .post('/institutions')
        .send(mockInstitutionData);

      expect(mockInstitutionService.create).toHaveBeenCalledWith(mockInstitutionData);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe(errorMessage);
    });

    it('should return appropriate error when type is invalid', async () => {
      const errorMessage = 'Tipo inválido. Deve ser ONG ou PREFEITURA';
      mockInstitutionService.create.mockRejectedValue(
        new AppError(errorMessage)
      );

      const invalidTypeData = {
        ...mockInstitutionData,
        type: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/institutions')
        .send(invalidTypeData);

      expect(mockInstitutionService.create).toHaveBeenCalledWith(invalidTypeData);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe(errorMessage);
    });
  });
}); 