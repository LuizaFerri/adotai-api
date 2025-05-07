import request from 'supertest';
import express from 'express';
import { PetStatusService, PetStatusType } from '../../services/pet-status.service';
import { PetStatusController } from '../../controllers/pet-status.controller';
import { errorHandler } from '../../middlewares/error';


jest.mock('../../services/pet-status.service');

describe('PetStatusController', () => {
  let app: express.Application;
  let mockPetStatusService: jest.Mocked<PetStatusService>;

 
  const mockUser = {
    id: 'inst-123',
    type: 'institution' as const
  };

  const mockPet = {
    id: 'pet-123',
    name: 'Rex',
    species: 'CACHORRO',
    breed: 'Labrador',
    description: 'Um cachorro amigável',
    createdAt: new Date(),
    updatedAt: new Date(),
    institutionId: 'inst-123',
    age: 3,
    size: 'MEDIO',
    gender: 'MACHO',
    isVaccinated: true,
    isNeutered: true,
    isAvailable: true,
    photos: ['foto1.jpg', 'foto2.jpg']
  };

  const mockStatus = {
    id: 'status-123',
    status: 'DISPONIVEL' as PetStatusType,
    description: 'Pet disponível para adoção',
    createdAt: new Date(),
    updatedAt: new Date(),
    petId: 'pet-123',
    institutionId: 'inst-123',
    institution: {
      name: 'Test Institution',
      city: 'Test City',
      state: 'TS'
    },
    pet: mockPet
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    

    mockPetStatusService = {
      getPetStatusHistory: jest.fn(),
      getCurrentStatus: jest.fn(),
      createStatus: jest.fn()
    } as unknown as jest.Mocked<PetStatusService>;
    

    (PetStatusService as jest.Mock).mockImplementation(() => mockPetStatusService);
    

    const petStatusController = new PetStatusController();
    

    app.get('/pets/:petId/status-history', (req, res, next) => {
      try {
        petStatusController.getStatusHistory(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.get('/pets/:petId/status', (req, res, next) => {
      try {
        petStatusController.getCurrentStatus(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.post('/pets/:petId/status', (req, res, next) => {

      (req as any).user = mockUser;
      try {
        petStatusController.createStatus(req, res);
      } catch (error) {
        next(error);
      }
    });
    

    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler(err, req, res, next);
    });
  });

  describe('GET /pets/:petId/status-history', () => {
    it('should return pet status history', async () => {
      const mockHistory = [mockStatus, { ...mockStatus, status: 'ADOTADO' }];
      
      mockPetStatusService.getPetStatusHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/pets/pet-123/status-history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetStatusService.getPetStatusHistory).toHaveBeenCalledWith('pet-123');
      expect(response.body).toMatchObject(mockHistory.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        pet: {
          ...item.pet,
          createdAt: item.pet.createdAt.toISOString(),
          updatedAt: item.pet.updatedAt.toISOString()
        }
      })));
    });

    it('should return 400 when there is an error fetching history', async () => {
      mockPetStatusService.getPetStatusHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/pets/pet-123/status-history')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetStatusService.getPetStatusHistory).toHaveBeenCalledWith('pet-123');
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /pets/:petId/status', () => {
    it('should return current pet status', async () => {
      mockPetStatusService.getCurrentStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/pets/pet-123/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetStatusService.getCurrentStatus).toHaveBeenCalledWith('pet-123');
      expect(response.body).toMatchObject({
        ...mockStatus,
        createdAt: mockStatus.createdAt.toISOString(),
        updatedAt: mockStatus.updatedAt.toISOString(),
        pet: {
          ...mockStatus.pet,
          createdAt: mockStatus.pet.createdAt.toISOString(),
          updatedAt: mockStatus.pet.updatedAt.toISOString()
        }
      });
    });

    it('should return 400 when there is an error fetching current status', async () => {
      mockPetStatusService.getCurrentStatus.mockRejectedValue(
        new Error('Nenhum status encontrado para este pet')
      );

      const response = await request(app)
        .get('/pets/pet-123/status')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetStatusService.getCurrentStatus).toHaveBeenCalledWith('pet-123');
      expect(response.body).toEqual({ error: 'Nenhum status encontrado para este pet' });
    });
  });

  describe('POST /pets/:petId/status', () => {
    const statusData = {
      status: 'ADOTADO' as PetStatusType,
      description: 'Pet foi adotado'
    };

    it('should create a new pet status', async () => {
      const createdStatus = { 
        ...mockStatus, 
        status: 'ADOTADO',
        description: 'Pet foi adotado',
        pet: {
          ...mockPet,
          description: 'Um cachorro amigável',
          createdAt: new Date(),
          updatedAt: new Date(),
          institutionId: 'inst-123',
          age: 3,
          size: 'MEDIO',
          gender: 'MACHO',
          isVaccinated: true,
          isNeutered: true,
          isAvailable: true,
          photos: ['foto1.jpg', 'foto2.jpg']
        }
      };
      
      mockPetStatusService.createStatus.mockResolvedValue(createdStatus);

      const response = await request(app)
        .post('/pets/pet-123/status')
        .send(statusData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(mockPetStatusService.createStatus).toHaveBeenCalledWith({
        petId: 'pet-123',
        institutionId: mockUser.id,
        status: statusData.status,
        description: statusData.description
      });

      expect(response.body).toMatchObject({
        ...createdStatus,
        createdAt: createdStatus.createdAt.toISOString(),
        updatedAt: createdStatus.updatedAt.toISOString(),
        pet: {
          ...createdStatus.pet,
          createdAt: createdStatus.pet.createdAt.toISOString(),
          updatedAt: createdStatus.pet.updatedAt.toISOString()
        }
      });
    });

    it('should return 400 when institution does not own the pet', async () => {
      mockPetStatusService.createStatus.mockRejectedValue(
        new Error('Você não tem permissão para alterar o status deste pet')
      );

      const response = await request(app)
        .post('/pets/pet-123/status')
        .send(statusData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetStatusService.createStatus).toHaveBeenCalledWith({
        petId: 'pet-123',
        institutionId: mockUser.id,
        status: statusData.status,
        description: statusData.description
      });

      expect(response.body).toEqual({ 
        error: 'Você não tem permissão para alterar o status deste pet' 
      });
    });

    it('should return 400 when pet is not found', async () => {
      mockPetStatusService.createStatus.mockRejectedValue(new Error('Pet não encontrado'));

      const response = await request(app)
        .post('/pets/nonexistent-id/status')
        .send(statusData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetStatusService.createStatus).toHaveBeenCalledWith({
        petId: 'nonexistent-id',
        institutionId: mockUser.id,
        status: statusData.status,
        description: statusData.description
      });

      expect(response.body).toEqual({ error: 'Pet não encontrado' });
    });
  });
}); 