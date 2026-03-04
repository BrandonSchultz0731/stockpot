---
name: testing
description: Testing conventions and patterns. Use when writing or running tests for server or client code.
---

# Testing Patterns

## Running tests

```bash
# Server (always use pnpm)
cd server
pnpm test              # single run
pnpm test:watch        # watch mode
pnpm test:cov          # with coverage

# Client (always use npm)
npm test
```

If watchman cache causes issues finding new files, use `npx jest --no-cache` directly.

## Server tests

### Location & naming

Tests live next to the code they test: `server/src/<feature>/<name>.spec.ts`

Examples:
- `server/src/auth/auth.service.spec.ts`
- `server/src/pantry/pantry.service.spec.ts`
- `server/src/utils/shelf-life.spec.ts`

### Service test structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyService } from './my.service';
import { MyEntity } from './entities/my.entity';

// Mock objects — plain objects with jest.fn() methods
const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockOtherService = {
  someMethod: jest.fn(),
};

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: getRepositoryToken(MyEntity), useValue: mockRepo },
        { provide: OtherService, useValue: mockOtherService },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  describe('findAllForUser', () => {
    it('should return items for user', async () => {
      const items = [{ id: '1', userId: 'u1' }];
      mockRepo.find.mockResolvedValue(items);

      const result = await service.findAllForUser('u1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        relations: ['relatedEntity'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(items);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when item not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('u1', 'bad-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

### Key conventions

- **Mock everything**: repositories, services, external libs — all via `{ provide: X, useValue: mockObject }`
- **`jest.clearAllMocks()`** in `beforeEach` to reset between tests
- **`getRepositoryToken(Entity)`** to mock TypeORM repositories
- **No real database** — all repo calls are mocked
- **Test behavior, not implementation**: verify what was called and what was returned
- **Async assertions**: `await expect(...).rejects.toThrow()` for error cases

### DTO validation tests

```typescript
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateItemDto } from './create-item.dto';

describe('CreateItemDto', () => {
  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateItemDto, {
      displayName: 'Chicken',
      quantity: 2,
      unit: 'lb',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without displayName', async () => {
    const dto = plainToInstance(CreateItemDto, { quantity: 2, unit: 'lb' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('displayName');
  });
});
```

### Pure utility tests

For files in `server/src/utils/`, test directly without NestJS testing module:

```typescript
import { parseShelfLife } from './shelf-life';

describe('parseShelfLife', () => {
  it('should parse valid shelf life object', () => {
    expect(parseShelfLife({ fridge: 7, freezer: 90 }))
      .toEqual({ fridge: 7, freezer: 90 });
  });

  it('should return undefined for empty input', () => {
    expect(parseShelfLife({})).toBeUndefined();
  });
});
```

### Mock return patterns

```typescript
// Single value
mockService.method.mockResolvedValue(result);
mockService.method.mockReturnValue(result);

// Sequential values
mockJwtService.sign
  .mockReturnValueOnce('access-token')
  .mockReturnValueOnce('refresh-token');

// Custom implementation
mockService.method.mockImplementation((input) => ({ ...input, id: 'generated' }));

// Module-level mocks (for external libraries)
jest.mock('bcrypt');
(bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
```

### Path aliases

Jest is configured with `moduleNameMapper` for the `@shared/*` alias:
```
"^@shared/(.*)$": "<rootDir>/../../shared/$1"
```

## Client tests

Minimal test coverage currently. Tests live in `__tests__/` at root.

Native modules are mocked in `jest.setup.js` (react-native-vision-camera, react-native-keychain, lucide-react-native, etc.).

```typescript
import ReactTestRenderer from 'react-test-renderer';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<MyComponent />);
  });
});
```
