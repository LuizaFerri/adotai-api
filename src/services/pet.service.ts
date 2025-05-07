import { PrismaClient } from '@prisma/client';
import { PetStatusService } from './pet-status.service';

interface CreatePetData {
  name: string;
  species: 'CACHORRO' | 'GATO';
  breed?: string;
  age: number;
  size: 'PEQUENO' | 'MEDIO' | 'GRANDE';
  gender: 'MACHO' | 'FEMEA';
  description: string;
  isVaccinated: boolean;
  isNeutered: boolean;
  photos: string[];
}

interface FindAllParams {
  page: number;
  limit: number;
  species?: string;
  size?: string;
  gender?: string;
  isAvailable?: boolean;
}

export class PetService {
  private prisma: PrismaClient;
  private petStatusService: PetStatusService;

  constructor() {
    this.prisma = new PrismaClient();
    this.petStatusService = new PetStatusService();
  }

  async create(petData: CreatePetData, institutionId: string) {
    const pet = await this.prisma.pet.create({
      data: {
        ...petData,
        institutionId,
        isAvailable: true
      }
    });

    await this.petStatusService.createStatus({
      status: 'DISPONIVEL',
      description: 'Pet cadastrado e disponível para adoção',
      petId: pet.id,
      institutionId
    });

    return pet;
  }

  async findAll({ page, limit, species, size, gender, isAvailable }: FindAllParams) {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(species && { species }),
      ...(size && { size }),
      ...(gender && { gender }),
      ...(isAvailable !== undefined && { isAvailable })
    };

    const [pets, total] = await Promise.all([
      this.prisma.pet.findMany({
        where,
        skip,
        take: limit,
        include: {
          institution: {
            select: {
              name: true,
              city: true,
              state: true
            }
          }
        }
      }),
      this.prisma.pet.count({ where })
    ]);

    return {
      pets,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
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

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    return pet;
  }

  async update(id: string, petData: Partial<CreatePetData>, institutionId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id }
    });

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    if (pet.institutionId !== institutionId) {
      throw new Error('Você não tem permissão para atualizar este pet');
    }

    const updatedPet = await this.prisma.pet.update({
      where: { id },
      data: petData
    });

    return updatedPet;
  }

  async delete(id: string, institutionId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id }
    });

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    if (pet.institutionId !== institutionId) {
      throw new Error('Você não tem permissão para excluir este pet');
    }

    await this.prisma.pet.delete({
      where: { id }
    });
  }
} 