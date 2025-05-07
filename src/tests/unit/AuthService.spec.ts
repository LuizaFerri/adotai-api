import { AuthService } from '../../services/AuthService';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError';
import authConfig from '../../config/auth';

jest.mock('../../utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn()
      },
      institution: {
        findUnique: jest.fn()
      }
    }
  };
});

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

import prismaMock from '../../utils/prisma';

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@email.com',
    cpf: '12345678900',
    password: 'hashedPassword123',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInstitution = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    name: 'Test NGO',
    email: 'ngo@email.com',
    cnpj: '12345678000100',
    type: 'NGO',
    password: 'hashedPassword456',
    responsibleName: 'Responsible Person',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 456',
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthData = {
    email: 'test@email.com',
    password: 'password123',
  };

  const mockToken = 'fake.jwt.token';

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
  });

  describe('authenticateUser', () => {
    it('should authenticate a user successfully', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.authenticateUser(mockAuthData);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthData.email }
      });
      
      expect(bcrypt.compare).toHaveBeenCalledWith(mockAuthData.password, mockUser.password);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { type: 'user' },
        authConfig.jwt.secret,
        {
          subject: mockUser.id,
          expiresIn: authConfig.jwt.expiresIn,
        }
      );

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          city: mockUser.city,
          state: mockUser.state,
          type: 'user',
        },
        token: mockToken,
      });
    });

    it('should throw an error when user email does not exist', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.authenticateUser(mockAuthData)).rejects.toThrow(AppError);
      await expect(authService.authenticateUser(mockAuthData)).rejects.toThrow('Email ou senha incorretos');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthData.email }
      });
      
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw an error when user password is incorrect', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.authenticateUser(mockAuthData)).rejects.toThrow(AppError);
      await expect(authService.authenticateUser(mockAuthData)).rejects.toThrow('Email ou senha incorretos');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthData.email }
      });
      
      expect(bcrypt.compare).toHaveBeenCalledWith(mockAuthData.password, mockUser.password);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('authenticateInstitution', () => {
    it('should authenticate an institution successfully', async () => {
      (prismaMock.institution.findUnique as jest.Mock).mockResolvedValue(mockInstitution);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.authenticateInstitution(mockAuthData);

      expect(prismaMock.institution.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthData.email }
      });
      
      expect(bcrypt.compare).toHaveBeenCalledWith(mockAuthData.password, mockInstitution.password);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { type: 'institution' },
        authConfig.jwt.secret,
        {
          subject: mockInstitution.id,
          expiresIn: authConfig.jwt.expiresIn,
        }
      );

      expect(result).toEqual({
        institution: {
          id: mockInstitution.id,
          name: mockInstitution.name,
          email: mockInstitution.email,
          type: mockInstitution.type,
          city: mockInstitution.city,
          state: mockInstitution.state,
        },
        token: mockToken,
      });
    });

    it('should throw an error when institution email does not exist', async () => {
      (prismaMock.institution.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.authenticateInstitution(mockAuthData)).rejects.toThrow(AppError);
      await expect(authService.authenticateInstitution(mockAuthData)).rejects.toThrow('Email ou senha incorretos');

      expect(prismaMock.institution.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthData.email }
      });
      
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
}); 