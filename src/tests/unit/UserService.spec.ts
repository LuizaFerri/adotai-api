import { UserService } from '../../services/UserService';
import * as bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError';
import { PrismaClient } from '@prisma/client';

jest.mock('../../utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findFirst: jest.fn(),
        create: jest.fn()
      }
    }
  };
});

jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

import prismaMock from '../../utils/prisma';

describe('UserService', () => {
  let userService: UserService;
  
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

  const mockUserInput = {
    name: 'Test User',
    email: 'test@email.com',
    cpf: '12345678900',
    password: 'password123',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 123',
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.create(mockUserInput);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockUserInput.email },
            { cpf: mockUserInput.cpf }
          ]
        }
      });
      
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserInput.password, 10);
      
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: mockUserInput.name,
          email: mockUserInput.email,
          cpf: mockUserInput.cpf,
          password: 'hashedPassword123',
          city: mockUserInput.city,
          state: mockUserInput.state,
          zipCode: mockUserInput.zipCode,
          address: mockUserInput.address,
        }
      });

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        cpf: mockUser.cpf,
        city: mockUser.city,
        state: mockUser.state,
      });
    });

    it('should throw an error when email is already registered', async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.create(mockUserInput)).rejects.toThrow(AppError);
      await expect(userService.create(mockUserInput)).rejects.toThrow('E-mail ou CPF já cadastrado');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockUserInput.email },
            { cpf: mockUserInput.cpf }
          ]
        }
      });
      
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
}); 