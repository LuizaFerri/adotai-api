import { PetStatusService, PetStatusType } from '../../services/pet-status.service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    pet: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    petStatus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('PetStatusService', () => {
  let petStatusService: PetStatusService;
  let mockPrismaClient: any;

  const mockPet = {
    id: 'pet-123',
    name: 'Rex',
    species: 'CACHORRO',
    institutionId: 'inst-123',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInstitutionId = 'inst-123';

  const mockPetStatus = {
    id: 'status-123',
    status: 'DISPONIVEL' as PetStatusType,
    description: 'Pet disponível para adoção',
    createdAt: new Date(),
    updatedAt: new Date(),
    petId: 'pet-123',
    institutionId: 'inst-123',
    pet: mockPet,
    institution: {
      name: 'Test Institution',
      city: 'Test City',
      state: 'TS'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient();
    petStatusService = new PetStatusService();
  });

  describe('createStatus', () => {
    it('should create a pet status successfully', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaClient.petStatus.create.mockResolvedValue(mockPetStatus);
      mockPrismaClient.pet.update.mockResolvedValue({ ...mockPet, isAvailable: true });

      const statusData = {
        status: 'DISPONIVEL' as PetStatusType,
        description: 'Pet disponível para adoção',
        petId: 'pet-123',
        institutionId: mockInstitutionId
      };

      const result = await petStatusService.createStatus(statusData);

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: statusData.petId }
      });

      expect(mockPrismaClient.petStatus.create).toHaveBeenCalledWith({
        data: statusData,
        include: {
          pet: true,
          institution: {
            select: {
              name: true,
              city: true,
              state: true
            }
          }
        }
      });

      expect(mockPrismaClient.pet.update).toHaveBeenCalledWith({
        where: { id: statusData.petId },
        data: {
          isAvailable: true
        }
      });

      expect(result).toEqual(mockPetStatus);
    });

    it('should update isAvailable to false when status is not DISPONIVEL', async () => {
      const notAvailableStatus = {
        ...mockPetStatus,
        status: 'ADOTADO' as PetStatusType
      };

      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaClient.petStatus.create.mockResolvedValue(notAvailableStatus);
      mockPrismaClient.pet.update.mockResolvedValue({ ...mockPet, isAvailable: false });

      const statusData = {
        status: 'ADOTADO' as PetStatusType,
        description: 'Pet adotado',
        petId: 'pet-123',
        institutionId: mockInstitutionId
      };

      await petStatusService.createStatus(statusData);

      expect(mockPrismaClient.pet.update).toHaveBeenCalledWith({
        where: { id: statusData.petId },
        data: {
          isAvailable: false
        }
      });
    });

    it('should throw an error when pet is not found', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(null);

      const statusData = {
        status: 'DISPONIVEL' as PetStatusType,
        description: 'Pet disponível para adoção',
        petId: 'nonexistent-id',
        institutionId: mockInstitutionId
      };

      await expect(petStatusService.createStatus(statusData)).rejects.toThrow('Pet não encontrado');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: statusData.petId }
      });
      
      expect(mockPrismaClient.petStatus.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.pet.update).not.toHaveBeenCalled();
    });

    it('should throw an error when institution does not own the pet', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);

      const statusData = {
        status: 'DISPONIVEL' as PetStatusType,
        description: 'Pet disponível para adoção',
        petId: 'pet-123',
        institutionId: 'different-inst-123'
      };

      await expect(petStatusService.createStatus(statusData)).rejects.toThrow('Você não tem permissão para alterar o status deste pet');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: statusData.petId }
      });
      
      expect(mockPrismaClient.petStatus.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.pet.update).not.toHaveBeenCalled();
    });
  });

  describe('getPetStatusHistory', () => {
    it('should get pet status history', async () => {
      const mockStatusHistory = [mockPetStatus, { ...mockPetStatus, status: 'ADOTADO' }];
      mockPrismaClient.petStatus.findMany.mockResolvedValue(mockStatusHistory);

      const result = await petStatusService.getPetStatusHistory('pet-123');

      expect(mockPrismaClient.petStatus.findMany).toHaveBeenCalledWith({
        where: { petId: 'pet-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true
            }
          }
        }
      });

      expect(result).toEqual(mockStatusHistory);
    });
  });

  describe('getCurrentStatus', () => {
    it('should get current pet status', async () => {
      mockPrismaClient.petStatus.findFirst.mockResolvedValue(mockPetStatus);

      const result = await petStatusService.getCurrentStatus('pet-123');

      expect(mockPrismaClient.petStatus.findFirst).toHaveBeenCalledWith({
        where: { petId: 'pet-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true
            }
          }
        }
      });

      expect(result).toEqual(mockPetStatus);
    });

    it('should throw an error when no status is found', async () => {
      mockPrismaClient.petStatus.findFirst.mockResolvedValue(null);

      await expect(petStatusService.getCurrentStatus('pet-123')).rejects.toThrow('Nenhum status encontrado para este pet');

      expect(mockPrismaClient.petStatus.findFirst).toHaveBeenCalledWith({
        where: { petId: 'pet-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true
            }
          }
        }
      });
    });
  });
}); 