import request from 'supertest';
import express from 'express';
import { PetService } from '../../services/pet.service';
import { PetController } from '../../controllers/pet.controller';
import { errorHandler } from '../../middlewares/error';
import { PetStatusService } from '../../services/pet-status.service';
import { PrismaClient } from '@prisma/client';


jest.mock('../../services/pet.service');
jest.mock('../../services/pet-status.service');
jest.mock('@prisma/client');

describe('PetController', () => {
  let app: express.Application;
  let mockPetService: jest.Mocked<PetService>;
  let mockPetStatusService: jest.Mocked<PetStatusService>;
  let mockPrismaClient: any;


  const mockUser = {
    id: 'inst-123',
    type: 'institution' as const
  };

  const mockPetData = {
    name: 'Rex',
    species: 'CACHORRO',
    breed: 'Labrador',
    age: 2,
    size: 'MEDIO',
    gender: 'MACHO',
    description: 'Friendly dog',
    isVaccinated: true,
    isNeutered: true,
    photos: ['photo1.jpg', 'photo2.jpg']
  };

  const mockPetResponse = {
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
    institution: {
      name: 'Test Institution',
      city: 'Test City',
      state: 'TS',
      address: 'Test Address',
      latitude: null,
      longitude: null
    }
  };

  const mockInstitution = {
    id: 'inst-123',
    name: 'Test Institution',
    city: 'Test City',
    state: 'TS',

  };

  beforeEach(() => {

    app = express();
    app.use(express.json());
    

    mockPetService = new PetService() as jest.Mocked<PetService>;
    mockPetStatusService = new PetStatusService() as jest.Mocked<PetStatusService>;
    

    mockPrismaClient = {
      institution: {
        findUnique: jest.fn().mockResolvedValue(mockInstitution)
      },
      $disconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);
    
    mockPetService.create = jest.fn();
    mockPetService.findAll = jest.fn();
    mockPetService.findById = jest.fn();
    mockPetService.update = jest.fn();
    mockPetService.delete = jest.fn();
    
    mockPetStatusService.createStatus = jest.fn();
    
    (PetService as jest.Mock).mockImplementation(() => mockPetService);
    (PetStatusService as jest.Mock).mockImplementation(() => mockPetStatusService);
    
    const petController = new PetController();
    
    app.post('/pets', (req, res, next) => {
      (req as any).user = mockUser;
      try {
        petController.create(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.get('/pets', (req, res, next) => {
      try {
        petController.findAll(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.get('/pets/:id', (req, res, next) => {
      try {
        petController.findById(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.put('/pets/:id', (req, res, next) => {
      (req as any).user = mockUser;
      try {
        petController.update(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.delete('/pets/:id', (req, res, next) => {
      (req as any).user = mockUser;
      try {
        petController.delete(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler(err, req, res, next);
    });
  });

  describe('POST /pets', () => {
    it('should create a pet and return 201', async () => {
      mockPetService.create.mockResolvedValue(mockPetResponse);

      const response = await request(app)
        .post('/pets')
        .send(mockPetData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(mockPrismaClient.institution.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      
      expect(mockPetService.create).toHaveBeenCalledWith(mockPetData, mockUser.id);
      expect(response.body).toMatchObject({
        ...mockPetResponse,
        createdAt: mockPetResponse.createdAt.toISOString(),
        updatedAt: mockPetResponse.updatedAt.toISOString()
      });
    });

    it('should return 400 when institution is not found', async () => {
      mockPrismaClient.institution.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/pets')
        .send(mockPetData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ error: 'Instituição não encontrada' });
      expect(mockPetService.create).not.toHaveBeenCalled();
    });

    it('should return 400 when there is an error creating the pet', async () => {
      mockPetService.create.mockRejectedValue(new Error('Invalid pet data'));

      const response = await request(app)
        .post('/pets')
        .send(mockPetData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid pet data' });
    });
  });

  describe('GET /pets', () => {
    it('should return a list of pets with pagination', async () => {
      const mockPaginatedResponse = {
        pets: [{
          ...mockPetResponse,
          institution: {
            name: 'Test Institution',
            city: 'Test City',
            state: 'TS'
          }
        }],
        total: 1,
        page: 1,
        totalPages: 1
      };

      mockPetService.findAll.mockResolvedValue(mockPaginatedResponse);

      const response = await request(app)
        .get('/pets')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        species: undefined,
        size: undefined,
        gender: undefined,
        isAvailable: false
      });

      expect(response.body).toMatchObject({
        ...mockPaginatedResponse,
        pets: [{
          ...mockPetResponse,
          createdAt: mockPetResponse.createdAt.toISOString(),
          updatedAt: mockPetResponse.updatedAt.toISOString(),
          institution: {
            name: 'Test Institution',
            city: 'Test City',
            state: 'TS'
          }
        }]
      });
    });

    it('should apply filters when provided', async () => {
      const mockPaginatedResponse = {
        pets: [{
          ...mockPetResponse,
          institution: {
            name: 'Test Institution',
            city: 'Test City',
            state: 'TS'
          }
        }],
        total: 1,
        page: 2,
        totalPages: 3
      };

      mockPetService.findAll.mockResolvedValue(mockPaginatedResponse);

      const response = await request(app)
        .get('/pets?page=2&limit=5&species=CACHORRO&size=MEDIO&gender=MACHO&isAvailable=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        species: 'CACHORRO',
        size: 'MEDIO',
        gender: 'MACHO',
        isAvailable: true
      });

      expect(response.body).toMatchObject({
        ...mockPaginatedResponse,
        pets: [{
          ...mockPetResponse,
          createdAt: mockPetResponse.createdAt.toISOString(),
          updatedAt: mockPetResponse.updatedAt.toISOString(),
          institution: {
            name: 'Test Institution',
            city: 'Test City',
            state: 'TS'
          }
        }]
      });
    });

    it('should return 400 when there is an error fetching the pets', async () => {
      mockPetService.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/pets')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /pets/:id', () => {
    it('should return a pet by id', async () => {
      mockPetService.findById.mockResolvedValue(mockPetResponse);

      const response = await request(app)
        .get('/pets/pet-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetService.findById).toHaveBeenCalledWith('pet-123');
      expect(response.body).toMatchObject({
        ...mockPetResponse,
        createdAt: mockPetResponse.createdAt.toISOString(),
        updatedAt: mockPetResponse.updatedAt.toISOString()
      });
    });

    it('should return 404 when pet is not found', async () => {
      mockPetService.findById.mockRejectedValue(new Error('Pet não encontrado'));

      const response = await request(app)
        .get('/pets/nonexistent-id')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(mockPetService.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(response.body).toEqual({ error: 'Pet não encontrado' });
    });
  });

  describe('PUT /pets/:id', () => {
    const updateData = { name: 'Updated Rex' };

    it('should update a pet successfully', async () => {
      const updatedPet = { ...mockPetResponse, name: 'Updated Rex' };
      mockPetService.update.mockResolvedValue(updatedPet);

      const response = await request(app)
        .put('/pets/pet-123')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockPetService.update).toHaveBeenCalledWith('pet-123', updateData, mockUser.id);
      expect(response.body).toMatchObject({
        ...updatedPet,
        createdAt: updatedPet.createdAt.toISOString(),
        updatedAt: updatedPet.updatedAt.toISOString()
      });
    });

    it('should return 400 when there is an error updating the pet', async () => {
      mockPetService.update.mockRejectedValue(new Error('Você não tem permissão para atualizar este pet'));

      const response = await request(app)
        .put('/pets/pet-123')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetService.update).toHaveBeenCalledWith('pet-123', updateData, mockUser.id);
      expect(response.body).toEqual({ error: 'Você não tem permissão para atualizar este pet' });
    });
  });

  describe('DELETE /pets/:id', () => {
    it('should delete a pet successfully', async () => {
      mockPetService.delete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/pets/pet-123')
        .expect(204);

      expect(mockPetService.delete).toHaveBeenCalledWith('pet-123', mockUser.id);
    });

    it('should return 400 when there is an error deleting the pet', async () => {
      mockPetService.delete.mockRejectedValue(new Error('Você não tem permissão para excluir este pet'));

      const response = await request(app)
        .delete('/pets/pet-123')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(mockPetService.delete).toHaveBeenCalledWith('pet-123', mockUser.id);
      expect(response.body).toEqual({ error: 'Você não tem permissão para excluir este pet' });
    });
  });
}); 