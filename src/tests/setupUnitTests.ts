import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

const prismaClientMock = mockDeep<PrismaClient>();

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: prismaClientMock
}));


export { prismaClientMock }; 