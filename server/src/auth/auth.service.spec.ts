import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

const mockUsersService = {
  createUser: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  validatePassword: jest.fn(),
  createSession: jest.fn(),
  findSessionById: jest.fn(),
  updateSessionToken: jest.fn(),
  deleteSession: jest.fn(),
  deleteAllUserSessions: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_ACCESS_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
    };
    return map[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default mocks for issueTokenPair flow
    mockUsersService.createSession.mockResolvedValue({ id: 'session-1' });
    mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    mockUsersService.updateSessionToken.mockResolvedValue(undefined);
  });

  describe('register', () => {
    it('should create user and return token pair', async () => {
      mockUsersService.createUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(mockUsersService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '15m',
      });
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nobody@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw same "Invalid credentials" for wrong password (no email enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should return same error message for missing user and wrong password', async () => {
      // Missing user
      mockUsersService.findByEmail.mockResolvedValue(null);
      try {
        await service.login('a@b.com', 'x');
      } catch (e1: any) {
        // Wrong password
        mockUsersService.findByEmail.mockResolvedValue({
          id: 'u1',
          email: 'a@b.com',
          passwordHash: 'h',
        });
        mockUsersService.validatePassword.mockResolvedValue(false);
        try {
          await service.login('a@b.com', 'x');
        } catch (e2: any) {
          expect(e1.message).toBe(e2.message);
        }
      }
    });
  });

  describe('refresh', () => {
    it('should issue new token pair for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
        jti: 'session-1',
      });
      mockUsersService.findSessionById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'hashed-old',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.deleteSession.mockResolvedValue(undefined);
      mockUsersService.findById.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      // Reset sign mock for new pair
      mockJwtService.sign.mockReset();
      mockJwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(mockUsersService.deleteSession).toHaveBeenCalledWith('session-1');
    });

    it('should throw UnauthorizedException for invalid/expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject access token submitted to refresh endpoint', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
        // no type field — this is an access token
      });

      await expect(service.refresh('access-token')).rejects.toThrow(
        'Invalid token type',
      );
    });

    it('should throw UnauthorizedException if session not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
        jti: 'deleted-session',
      });
      mockUsersService.findSessionById.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(
        'Session not found',
      );
    });

    it('should revoke all sessions on token reuse detection', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
        jti: 'session-1',
      });
      mockUsersService.findSessionById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'hashed-old',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // token reuse

      await expect(service.refresh('reused-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUsersService.deleteAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should throw UnauthorizedException if user deleted between sessions', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
        jti: 'session-1',
      });
      mockUsersService.findSessionById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.deleteSession.mockResolvedValue(undefined);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should delete session for valid token', async () => {
      mockJwtService.verify.mockReturnValue({ jti: 'session-1' });
      mockUsersService.deleteSession.mockResolvedValue(undefined);

      await service.logout('valid-token');

      expect(mockUsersService.deleteSession).toHaveBeenCalledWith('session-1');
    });

    it('should gracefully handle expired token without throwing', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.logout('expired-token')).resolves.toBeUndefined();
    });

    it('should not throw when jti is missing from payload', async () => {
      mockJwtService.verify.mockReturnValue({});

      await expect(service.logout('no-jti-token')).resolves.toBeUndefined();
      expect(mockUsersService.deleteSession).not.toHaveBeenCalled();
    });
  });

  describe('issueTokenPair (via register)', () => {
    it('should create session, sign tokens, and hash refresh token', async () => {
      mockUsersService.createUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      await service.register({
        email: 'test@example.com',
        password: 'pass',
        firstName: 'T',
      });

      expect(mockUsersService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          refreshToken: 'pending',
        }),
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 12);
      expect(mockUsersService.updateSessionToken).toHaveBeenCalledWith(
        'session-1',
        'hashed-refresh',
        expect.any(Date),
      );
    });
  });

  describe('calculateExpiry (via issueTokenPair)', () => {
    it('should parse seconds duration', async () => {
      mockConfigService.get.mockReturnValue('30s');
      mockUsersService.createUser.mockResolvedValue({
        id: 'u1',
        email: 'e@e.com',
      });

      const before = Date.now();
      await service.register({
        email: 'e@e.com',
        password: 'p',
        firstName: 'F',
      });

      const sessionCall = mockUsersService.createSession.mock.calls[0][0];
      const expiry = sessionCall.expiresAt.getTime();
      expect(expiry).toBeGreaterThanOrEqual(before + 30 * 1000 - 100);
      expect(expiry).toBeLessThanOrEqual(Date.now() + 30 * 1000 + 100);
    });

    it('should parse hours duration', async () => {
      mockConfigService.get.mockReturnValue('2h');
      mockUsersService.createUser.mockResolvedValue({
        id: 'u1',
        email: 'e@e.com',
      });

      const before = Date.now();
      await service.register({
        email: 'e@e.com',
        password: 'p',
        firstName: 'F',
      });

      const sessionCall = mockUsersService.createSession.mock.calls[0][0];
      const expiry = sessionCall.expiresAt.getTime();
      expect(expiry).toBeGreaterThanOrEqual(before + 2 * 60 * 60 * 1000 - 100);
    });

    it('should default to 7 days for invalid duration', async () => {
      mockConfigService.get.mockReturnValue('invalid');
      mockUsersService.createUser.mockResolvedValue({
        id: 'u1',
        email: 'e@e.com',
      });

      const before = Date.now();
      await service.register({
        email: 'e@e.com',
        password: 'p',
        firstName: 'F',
      });

      const sessionCall = mockUsersService.createSession.mock.calls[0][0];
      const expiry = sessionCall.expiresAt.getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(expiry).toBeGreaterThanOrEqual(before + sevenDays - 100);
    });
  });
});
