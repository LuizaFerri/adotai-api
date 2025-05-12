import { InstitutionService } from '../../services/InstitutionService';
import * as bcrypt from 'bcryptjs';
import { AppError } from '../../utils/AppError';
import { PrismaClient } from '@prisma/client';

jest.mock('../../utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      institution: {
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

describe('InstitutionService', () => {
  let institutionService: InstitutionService;
  
  const mockInstitution = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    name: 'Test NGO',
    email: 'ngo@email.com',
    cnpj: '12345678000100',
    type: 'ONG',
    password: 'hashedPassword456',
    responsibleName: 'Responsible Person',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 456',
    latitude: undefined,
    longitude: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInstitutionInput = {
    name: 'Test NGO',
    email: 'ngo@email.com',
    cnpj: '12345678000100',
    type: 'ONG',
    password: 'password456',
    responsibleName: 'Responsible Person',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    address: 'Test Street, 456',
    latitude: undefined,
    longitude: undefined,
  };

  beforeEach(() => {
    institutionService = new InstitutionService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an institution successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword456');
      (prismaMock.institution.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.institution.create as jest.Mock).mockResolvedValue(mockInstitution);

      const result = await institutionService.create(mockInstitutionInput);

      expect(prismaMock.institution.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockInstitutionInput.email },
            { cnpj: mockInstitutionInput.cnpj }
          ]
        }
      });
      
      expect(bcrypt.hash).toHaveBeenCalledWith(mockInstitutionInput.password, 10);
      
      expect(prismaMock.institution.create).toHaveBeenCalledWith({
        data: {
          name: mockInstitutionInput.name,
          email: mockInstitutionInput.email,
          cnpj: mockInstitutionInput.cnpj,
          password: 'hashedPassword456',
          responsibleName: mockInstitutionInput.responsibleName,
          type: mockInstitutionInput.type,
          city: mockInstitutionInput.city,
          state: mockInstitutionInput.state,
          zipCode: mockInstitutionInput.zipCode,
          address: mockInstitutionInput.address,
          latitude: mockInstitutionInput.latitude,
          longitude: mockInstitutionInput.longitude
        }
      });

      expect(result).toEqual({
        id: mockInstitution.id,
        name: mockInstitution.name,
        email: mockInstitution.email,
        cnpj: mockInstitution.cnpj,
        type: mockInstitution.type,
        responsibleName: mockInstitution.responsibleName,
        city: mockInstitution.city,
        state: mockInstitution.state,
      });
    });

    it('should throw an error when email or CNPJ is already registered', async () => {
      (prismaMock.institution.findFirst as jest.Mock).mockResolvedValue(mockInstitution);

      await expect(institutionService.create(mockInstitutionInput)).rejects.toThrow(AppError);
      await expect(institutionService.create(mockInstitutionInput)).rejects.toThrow('E-mail ou CNPJ já cadastrado');

      expect(prismaMock.institution.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockInstitutionInput.email },
            { cnpj: mockInstitutionInput.cnpj }
          ]
        }
      });
      
      expect(prismaMock.institution.create).not.toHaveBeenCalled();
    });

    it('should throw an error when type is invalid', async () => {
      const invalidTypeInput = {
        ...mockInstitutionInput,
        type: 'INVALID_TYPE',
      };

      await expect(institutionService.create(invalidTypeInput)).rejects.toThrow(AppError);
      await expect(institutionService.create(invalidTypeInput)).rejects.toThrow('Tipo inválido. Deve ser ONG ou PREFEITURA');

      expect(prismaMock.institution.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.institution.create).not.toHaveBeenCalled();
    });

    it('should accept PREFEITURA as a valid type', async () => {
      const municipalityInput = {
        ...mockInstitutionInput,
        type: 'PREFEITURA',
      };

      const municipalityResult = {
        ...mockInstitution,
        type: 'PREFEITURA',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword456');
      (prismaMock.institution.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.institution.create as jest.Mock).mockResolvedValue(municipalityResult);

      const result = await institutionService.create(municipalityInput);

      expect(result.type).toBe('PREFEITURA');
      expect(prismaMock.institution.create).toHaveBeenCalled();
    });
  });
}); 