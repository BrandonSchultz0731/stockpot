import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefreshTokenDto } from './refresh-token.dto';

function createDto(data: Partial<RefreshTokenDto>): RefreshTokenDto {
  return plainToInstance(RefreshTokenDto, data);
}

describe('RefreshTokenDto', () => {
  it('should pass validation with a valid refreshToken string', async () => {
    const dto = createDto({ refreshToken: 'some-token-value' });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when refreshToken is missing', async () => {
    const dto = createDto({});

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'refreshToken');
    expect(tokenError).toBeDefined();
  });

  it('should fail when refreshToken is not a string', async () => {
    const dto = createDto({ refreshToken: 123 as any });

    const errors = await validate(dto);
    const tokenError = errors.find(e => e.property === 'refreshToken');
    expect(tokenError).toBeDefined();
  });
});
