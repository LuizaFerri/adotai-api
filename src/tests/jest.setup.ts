import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';


jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>()
})); 