import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

function createDto(data: Partial<LoginDto>): LoginDto {
  return plainToInstance(LoginDto, data);
}

describe('LoginDto', () => {
  it('should pass validation with valid email and password', async () => {
    const dto = createDto({
      email: 'test@example.com',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid email', async () => {
    const dto = createDto({
      email: 'not-an-email',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail with missing password', async () => {
    const dto = createDto({ email: 'test@example.com' });

    const errors = await validate(dto);
    const passwordError = errors.find(e => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('should fail with missing email', async () => {
    const dto = createDto({ password: 'password123' });

    const errors = await validate(dto);
    const emailError = errors.find(e => e.property === 'email');
    expect(emailError).toBeDefined();
  });
});
