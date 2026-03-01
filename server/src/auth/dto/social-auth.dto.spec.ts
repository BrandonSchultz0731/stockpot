import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppleAuthDto, GoogleAuthDto } from './social-auth.dto';

describe('AppleAuthDto', () => {
  function createDto(data: Partial<AppleAuthDto>): AppleAuthDto {
    return plainToInstance(AppleAuthDto, data);
  }

  it('should pass validation with only identityToken', async () => {
    const dto = createDto({ identityToken: 'eyJhbGciOi...' });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with optional name fields', async () => {
    const dto = createDto({
      identityToken: 'eyJhbGciOi...',
      firstName: 'John',
      lastName: 'Doe',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when identityToken is missing', async () => {
    const dto = createDto({});

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'identityToken');
    expect(tokenError).toBeDefined();
  });

  it('should fail when identityToken is not a string', async () => {
    const dto = createDto({ identityToken: 123 as any });

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'identityToken');
    expect(tokenError).toBeDefined();
  });
});

describe('GoogleAuthDto', () => {
  function createDto(data: Partial<GoogleAuthDto>): GoogleAuthDto {
    return plainToInstance(GoogleAuthDto, data);
  }

  it('should pass validation with idToken', async () => {
    const dto = createDto({ idToken: 'eyJhbGciOi...' });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when idToken is missing', async () => {
    const dto = createDto({});

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'idToken');
    expect(tokenError).toBeDefined();
  });

  it('should fail when idToken is not a string', async () => {
    const dto = createDto({ idToken: 123 as any });

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'idToken');
    expect(tokenError).toBeDefined();
  });
});
