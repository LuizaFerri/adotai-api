import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import authConfig from '../config/auth';

interface AuthRequest {
  email: string;
  password: string;
}

interface UserAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    city?: string;
    state?: string;
    type: string;
  };
  token: string;
}

interface InstitutionAuthResponse {
  institution: {
    id: string;
    name: string;
    email: string;
    type: string;
    city: string;
    state: string;
  };
  token: string;
}

export class AuthService {
  async authenticateUser({ email, password }: AuthRequest): Promise<UserAuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    const { secret, expiresIn } = authConfig.jwt;

    // @ts-ignore - Ignorar erro de tipagem
    const token = sign(
      { type: 'user' },
      secret,
      {
        subject: user.id,
        expiresIn,
      }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city || undefined,
        state: user.state || undefined,
        type: 'user',
      },
      token,
    };
  }

  async authenticateInstitution({ email, password }: AuthRequest): Promise<InstitutionAuthResponse> {
    const institution = await prisma.institution.findUnique({
      where: { email },
    });

    if (!institution) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    const passwordMatched = await compare(password, institution.password);

    if (!passwordMatched) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    const { secret, expiresIn } = authConfig.jwt;

    // @ts-ignore - Ignorar erro de tipagem
    const token = sign(
      { type: 'institution' },
      secret,
      {
        subject: institution.id,
        expiresIn,
      }
    );

    return {
      institution: {
        id: institution.id,
        name: institution.name,
        email: institution.email,
        type: institution.type,
        city: institution.city,
        state: institution.state,
      },
      token,
    };
  }
} 