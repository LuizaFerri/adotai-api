import { hash } from 'bcrypt';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

interface CreateUserDTO {
  name: string;
  email: string;
  cpf: string;
  password: string;
  city?: string;
  state?: string;
  zipCode?: string;
  address?: string;
}

export class UserService {
  async create({ name, email, cpf, password, city, state, zipCode, address }: CreateUserDTO) {
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { cpf }]
      },
    });

    if (userExists) {
      throw new AppError('E-mail ou CPF já cadastrado');
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        cpf,
        password: hashedPassword,
        city,
        state,
        zipCode,
        address,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      city: user.city,
      state: user.state,
    };
  }
} 