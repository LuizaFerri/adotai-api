import { PetService } from '../../services/pet.service';
import { PrismaClient } from '@prisma/client';

jest.mock('../../services/pet-status.service', () => {
  return {
    PetStatusService: jest.fn().mockImplementation(() => {
      return {
        createStatus: jest.fn().mockResolvedValue({
          id: 'status-123',
          status: 'DISPONIVEL',
          description: 'Pet cadastrado e disponível para adoção',
          createdAt: new Date(),
          updatedAt: new Date(),
          petId: 'pet-123',
          institutionId: 'inst-123'
        })
      };
    })
  };
});

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    pet: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn()
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('PetService', () => {
  let petService: PetService;
  let mockPrismaClient: any;

  const mockPet = {
    id: 'pet-123',
    name: 'Rex',
    species: 'CACHORRO',
    breed: 'Labrador',
    age: 2,
    size: 'MEDIO',
    gender: 'MACHO',
    description: 'Friendly dog',
    isVaccinated: true,
    isNeutered: true,
    photos: ['photo1.jpg', 'photo2.jpg'],
    isAvailable: true,
    institutionId: 'inst-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPetInput = {
    name: 'Rex',
    species: 'CACHORRO' as const,
    breed: 'Labrador',
    age: 2,
    size: 'MEDIO' as const,
    gender: 'MACHO' as const,
    description: 'Friendly dog',
    isVaccinated: true,
    isNeutered: true,
    photos: ['photo1.jpg', 'photo2.jpg']
  };

  const mockInstitutionId = 'inst-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient();
    petService = new PetService();
  });

  describe('create', () => {
    it('should create a pet successfully', async () => {
      mockPrismaClient.pet.create.mockResolvedValue(mockPet);

      const result = await petService.create(mockPetInput, mockInstitutionId);

      expect(mockPrismaClient.pet.create).toHaveBeenCalledWith({
        data: {
          ...mockPetInput,
          institutionId: mockInstitutionId,
          isAvailable: true
        }
      });

      expect(result).toEqual(mockPet);
    });
  });

  describe('findAll', () => {
    it('should find all pets with pagination', async () => {
      const mockPets = [mockPet];
      const mockTotal = 1;
      
      mockPrismaClient.pet.findMany.mockResolvedValue(mockPets);
      mockPrismaClient.pet.count.mockResolvedValue(mockTotal);

      const result = await petService.findAll({ 
        page: 1, 
        limit: 10 
      });

      expect(mockPrismaClient.pet.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
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

      expect(mockPrismaClient.pet.count).toHaveBeenCalledWith({
        where: {}
      });

      expect(result).toEqual({
        pets: mockPets,
        total: mockTotal,
        page: 1,
        totalPages: 1
      });
    });

    it('should find pets with filters', async () => {
      const mockPets = [mockPet];
      const mockTotal = 1;
      
      mockPrismaClient.pet.findMany.mockResolvedValue(mockPets);
      mockPrismaClient.pet.count.mockResolvedValue(mockTotal);

      const filters = {
        page: 1,
        limit: 10,
        species: 'CACHORRO',
        size: 'MEDIO',
        gender: 'MACHO',
        isAvailable: true
      };

      const result = await petService.findAll(filters);

      expect(mockPrismaClient.pet.findMany).toHaveBeenCalledWith({
        where: {
          species: 'CACHORRO',
          size: 'MEDIO',
          gender: 'MACHO',
          isAvailable: true
        },
        skip: 0,
        take: 10,
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

      expect(result).toEqual({
        pets: mockPets,
        total: mockTotal,
        page: 1,
        totalPages: 1
      });
    });
  });

  describe('findById', () => {
    it('should find a pet by id', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);

      const result = await petService.findById('pet-123');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-123' },
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true,
              address: true,
              latitude: true,
              longitude: true
            }
          }
        }
      });

      expect(result).toEqual(mockPet);
    });

    it('should throw an error when pet is not found', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(null);

      await expect(petService.findById('nonexistent-id')).rejects.toThrow('Pet não encontrado');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true,
              address: true,
              latitude: true,
              longitude: true
            }
          }
        }
      });
    });
  });

  describe('update', () => {
    const updateData = { name: 'Updated Rex' };

    it('should update a pet successfully', async () => {
      const updatedPet = { ...mockPet, name: 'Updated Rex' };
      
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaClient.pet.update.mockResolvedValue(updatedPet);

      const result = await petService.update('pet-123', updateData, mockInstitutionId);

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-123' }
      });

      expect(mockPrismaClient.pet.update).toHaveBeenCalledWith({
        where: { id: 'pet-123' },
        data: updateData
      });

      expect(result).toEqual(updatedPet);
    });

    it('should throw an error when pet is not found', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(null);

      await expect(petService.update('nonexistent-id', updateData, mockInstitutionId))
        .rejects.toThrow('Pet não encontrado');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' }
      });
      
      expect(mockPrismaClient.pet.update).not.toHaveBeenCalled();
    });

    it('should throw an error when institution does not own the pet', async () => {
      const differentInstitutionId = 'different-inst-123';
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);

      await expect(petService.update('pet-123', updateData, differentInstitutionId))
        .rejects.toThrow('Você não tem permissão para atualizar este pet');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-123' }
      });
      
      expect(mockPrismaClient.pet.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a pet successfully', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);
      mockPrismaClient.pet.delete.mockResolvedValue(mockPet);

      await petService.delete('pet-123', mockInstitutionId);

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-123' }
      });

      expect(mockPrismaClient.pet.delete).toHaveBeenCalledWith({
        where: { id: 'pet-123' }
      });
    });

    it('should throw an error when pet is not found', async () => {
      mockPrismaClient.pet.findUnique.mockResolvedValue(null);

      await expect(petService.delete('nonexistent-id', mockInstitutionId))
        .rejects.toThrow('Pet não encontrado');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' }
      });
      
      expect(mockPrismaClient.pet.delete).not.toHaveBeenCalled();
    });

    it('should throw an error when institution does not own the pet', async () => {
      const differentInstitutionId = 'different-inst-123';
      mockPrismaClient.pet.findUnique.mockResolvedValue(mockPet);

      await expect(petService.delete('pet-123', differentInstitutionId))
        .rejects.toThrow('Você não tem permissão para excluir este pet');

      expect(mockPrismaClient.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-123' }
      });
      
      expect(mockPrismaClient.pet.delete).not.toHaveBeenCalled();
    });
  });
}); 