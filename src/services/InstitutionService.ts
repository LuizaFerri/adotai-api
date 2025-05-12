import { hash } from 'bcryptjs';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

interface CreateInstitutionDTO {
  name: string;
  email: string;
  cnpj: string;
  password: string;
  responsibleName: string;
  type: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export class InstitutionService {
  async create({
    name,
    email,
    cnpj,
    password,
    responsibleName,
    type,
    city,
    state,
    zipCode,
    address,
    latitude,
    longitude
  }: CreateInstitutionDTO) {
    if (type !== 'ONG' && type !== 'PREFEITURA') {
      throw new AppError('Tipo inválido. Deve ser ONG ou PREFEITURA');
    }

    const institutionExists = await prisma.institution.findFirst({
      where: {
        OR: [{ email }, { cnpj }]
      },
    });

    if (institutionExists) {
      throw new AppError('E-mail ou CNPJ já cadastrado');
    }

    const hashedPassword = await hash(password, 10);

    const institution = await prisma.institution.create({
      data: {
        name,
        email,
        cnpj,
        password: hashedPassword,
        responsibleName,
        type,
        city,
        state,
        zipCode,
        address,
        latitude,
        longitude
      },
    });

    return {
      id: institution.id,
      name: institution.name,
      email: institution.email,
      cnpj: institution.cnpj,
      type: institution.type,
      responsibleName: institution.responsibleName,
      city: institution.city,
      state: institution.state,
    };
  }
} 