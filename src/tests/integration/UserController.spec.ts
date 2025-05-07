import request from 'supertest';
import express from 'express';
import { UserService } from '../../services/UserService';
import { UserController } from '../../controllers/UserController';
import { AppError } from '../../utils/AppError';
import { errorHandler } from '../../middlewares/error';

// Mock do UserService
jest.mock('../../services/UserService');

describe('UserController', () => {
  let app: express.Application;
  let mockUserService: jest.Mocked<UserService>;
  
  const mockUserData = {
    name: 'Test User',
    email: 'test@email.com',
    cpf: '12345678900',
    password: 'password123',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 123',
  };

  const mockUserResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@email.com',
    cpf: '12345678900',
    city: 'New York',
    state: 'NY',
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockUserService = new UserService() as jest.Mocked<UserService>;
    
    mockUserService.create = jest.fn();
    
    const userController = new UserController();
    app.post('/users', async (req, res, next) => {
      try {
        await userController.create(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler(err, req, res, next);
    });
    
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
  });

  describe('POST /users', () => {
    it('should create a user and return 201', async () => {
      mockUserService.create.mockResolvedValue(mockUserResponse);

      const response = await request(app)
        .post('/users')
        .send(mockUserData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(mockUserService.create).toHaveBeenCalledWith(mockUserData);
      expect(response.body).toEqual(mockUserResponse);
    });

    it('should return appropriate error when email or CPF is already registered', async () => {
      const errorMessage = 'E-mail ou CPF já cadastrado';
      mockUserService.create.mockRejectedValue(
        new AppError(errorMessage)
      );

      const response = await request(app)
        .post('/users')
        .send(mockUserData);

      expect(mockUserService.create).toHaveBeenCalledWith(mockUserData);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe(errorMessage);
    });
  });
}); 