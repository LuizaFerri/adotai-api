import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import authConfig from '../config/auth';
import { AppError } from '../utils/AppError';

interface TokenPayload {
  iat: number;
  exp: number;
  sub: string;
  type: 'user' | 'institution';
}

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token não informado', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, authConfig.jwt.secret);
    const { sub, type } = decoded as TokenPayload;

    req.user = {
      id: sub,
      type,
    };

    return next();
  } catch (error) {
    throw new AppError('Token JWT inválido', 401);
  }
} 