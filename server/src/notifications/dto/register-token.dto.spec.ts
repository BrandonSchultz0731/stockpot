import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterTokenDto } from './register-token.dto';

function createDto(data: Record<string, unknown>): RegisterTokenDto {
  return plainToInstance(RegisterTokenDto, data);
}

describe('RegisterTokenDto', () => {
  it('should pass with valid ios token', async () => {
    const dto = createDto({
      pushToken: 'fcm-token-abc123',
      pushPlatform: 'ios',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid android token', async () => {
    const dto = createDto({
      pushToken: 'fcm-token-xyz789',
      pushPlatform: 'android',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when pushToken is missing', async () => {
    const dto = createDto({ pushPlatform: 'ios' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when pushPlatform is missing', async () => {
    const dto = createDto({ pushToken: 'fcm-token-abc123' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid pushPlatform value', async () => {
    const dto = createDto({
      pushToken: 'fcm-token-abc123',
      pushPlatform: 'web',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when pushToken is not a string', async () => {
    const dto = createDto({
      pushToken: 12345,
      pushPlatform: 'ios',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
