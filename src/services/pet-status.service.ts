import { PrismaClient } from '@prisma/client';

export type PetStatusType = 'DISPONIVEL' | 'EM_PROCESSO' | 'ADOTADO' | 'INDISPONIVEL';

interface CreatePetStatusData {
  status: PetStatusType;
  description?: string;
  petId: string;
  institutionId: string;
}

export class PetStatusService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createStatus(data: CreatePetStatusData) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: data.petId }
    });

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    if (pet.institutionId !== data.institutionId) {
      throw new Error('Você não tem permissão para alterar o status deste pet');
    }

    const petStatus = await this.prisma.petStatus.create({
      data: {
        status: data.status,
        description: data.description,
        petId: data.petId,
        institutionId: data.institutionId
      },
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

    await this.prisma.pet.update({
      where: { id: data.petId },
      data: {
        isAvailable: data.status === 'DISPONIVEL'
      }
    });

    return petStatus;
  }

  async getPetStatusHistory(petId: string) {
    const statusHistory = await this.prisma.petStatus.findMany({
      where: { petId },
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

    return statusHistory;
  }

  async getCurrentStatus(petId: string) {
    const currentStatus = await this.prisma.petStatus.findFirst({
      where: { petId },
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

    if (!currentStatus) {
      throw new Error('Nenhum status encontrado para este pet');
    }

    return currentStatus;
  }
} 