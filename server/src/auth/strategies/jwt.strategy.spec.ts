import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

const mockUsersService = {
  findById: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when user exists', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        firstName: 'Test',
      });

      const result = await strategy.validate({ sub: 'u1', email: 'a@b.com' });

      expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
      expect(mockUsersService.findById).toHaveBeenCalledWith('u1');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'deleted', email: 'a@b.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
