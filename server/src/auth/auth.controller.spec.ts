import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should delegate to AuthService.register', async () => {
      const dto = {
        email: 'a@b.com',
        password: 'pass1234',
        firstName: 'Test',
      };
      const tokens = {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: '15m',
      };
      mockAuthService.register.mockResolvedValue(tokens);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('login', () => {
    it('should delegate to AuthService.login with email and password', async () => {
      const dto = { email: 'a@b.com', password: 'pass1234' };
      const tokens = {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: '15m',
      };
      mockAuthService.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'a@b.com',
        'pass1234',
      );
      expect(result).toEqual(tokens);
    });
  });

  describe('refresh', () => {
    it('should delegate to AuthService.refresh', async () => {
      const dto = { refreshToken: 'rt' };
      const tokens = {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        expiresIn: '15m',
      };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('rt');
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('should delegate to AuthService.logout and return message', async () => {
      const dto = { refreshToken: 'rt' };
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(dto);

      expect(mockAuthService.logout).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});
