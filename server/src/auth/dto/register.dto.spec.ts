import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

function createDto(data: Partial<RegisterDto>): RegisterDto {
  return plainToInstance(RegisterDto, data);
}

describe('RegisterDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with optional lastName', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid email', async () => {
    const dto = createDto({
      email: 'not-an-email',
      password: 'password123',
      firstName: 'Test',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail with password shorter than 8 characters', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'short',
      firstName: 'Test',
    });

    const errors = await validate(dto);
    const passwordError = errors.find(e => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('should fail with password longer than 72 characters', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'a'.repeat(73),
      firstName: 'Test',
    });

    const errors = await validate(dto);
    const passwordError = errors.find(e => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('should fail with empty firstName', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
      firstName: '',
    });

    const errors = await validate(dto);
    const nameError = errors.find(e => e.property === 'firstName');
    expect(nameError).toBeDefined();
  });

  it('should fail with firstName longer than 100 characters', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'a'.repeat(101),
    });

    const errors = await validate(dto);
    const nameError = errors.find(e => e.property === 'firstName');
    expect(nameError).toBeDefined();
  });

  it('should fail with lastName longer than 100 characters', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'a'.repeat(101),
    });

    const errors = await validate(dto);
    const nameError = errors.find(e => e.property === 'lastName');
    expect(nameError).toBeDefined();
  });
});
