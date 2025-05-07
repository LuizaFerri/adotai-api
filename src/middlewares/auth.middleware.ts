import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';
import { PrismaClient } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    id: string;
    type: 'user' | 'institution';
  };
}

interface TokenPayload {
  sub: string;
  type: 'user' | 'institution';
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const token = authorization.replace('Bearer ', '').trim();

  try {
    const jwtSecret = authConfig.jwt.secret;
    
    const data = jwt.verify(token, jwtSecret);
    
    const { sub, type } = data as TokenPayload;

    if (type === 'institution') {
      const prisma = new PrismaClient();
      const institution = await prisma.institution.findUnique({
        where: { id: sub }
      });
      
      if (!institution) {
        console.error('Instituição não encontrada no banco de dados com ID:', sub);
        return res.status(401).json({ error: 'Instituição não encontrada' });
      }
      
      console.log('Instituição encontrada:', institution.name);
      await prisma.$disconnect();
    }

    (req as RequestWithUser).user = { 
      id: sub, 
      type 
    };

    return next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}; 