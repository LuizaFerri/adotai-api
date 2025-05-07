import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('../../utils/prisma', () => ({
  __esModule: true,
  default: prismaMock
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export { prismaMock }; 