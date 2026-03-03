---
name: nestjs-endpoint
description: How to add NestJS backend endpoints. Use when creating entities, DTOs, services, controllers, or modules in the server.
---

# NestJS Endpoint Pattern

All server code lives in `server/src/`. Features are organized as NestJS modules with entities, DTOs, services, and controllers.

## 1. Entity (TypeORM)

File: `server/src/<feature>/entities/<name>.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('table_name')
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

Key conventions:
- UUID primary keys (`@PrimaryGeneratedColumn('uuid')`)
- Snake_case column names with `name:` option, camelCase properties
- `@Index()` on `userId` columns
- `@CreateDateColumn` / `@UpdateDateColumn` for timestamps
- `{ onDelete: 'CASCADE' }` or `'SET NULL'` on relations
- `type: 'jsonb'` for complex nested data

## 2. DTO (class-validator)

File: `server/src/<feature>/dto/<name>.dto.ts`

```typescript
import {
  IsString, IsNumber, IsOptional, IsUUID, IsEnum,
  IsBoolean, IsArray, IsInt, Min, Max, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  displayName: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

For nested objects:
```typescript
@ValidateNested()
@Type(() => NestedDto)
nested: NestedDto;

// For arrays of nested objects:
@IsArray()
@ValidateNested({ each: true })
@Type(() => NestedDto)
items: NestedDto[];
```

## 3. Service

File: `server/src/<feature>/<feature>.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  constructor(
    @InjectRepository(MyEntity)
    private readonly myRepo: Repository<MyEntity>,
    private readonly otherService: OtherService,
  ) {}

  async findAllForUser(userId: string): Promise<MyEntity[]> {
    return this.myRepo.find({
      where: { userId },
      relations: ['relatedEntity'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateItemDto): Promise<MyEntity> {
    const item = this.myRepo.create({ userId, ...dto });
    return this.myRepo.save(item);
  }

  async update(userId: string, id: string, dto: UpdateItemDto): Promise<MyEntity> {
    const item = await this.myRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item not found');
    Object.assign(item, dto);
    return this.myRepo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.myRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item not found');
    await this.myRepo.remove(item);
  }
}
```

Key conventions:
- `@Injectable()` on all services
- `@InjectRepository(Entity)` for TypeORM repos — no custom repository classes
- Always filter by `userId` for user-scoped data
- `NotFoundException` for missing resources
- `Object.assign(item, dto)` for partial updates
- Repository methods: `.find()`, `.findOne()`, `.create()`, `.save()`, `.remove()`

## 4. Controller

File: `server/src/<feature>/<feature>.controller.ts`

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('my-feature')
@UseGuards(JwtAuthGuard)
export class MyController {
  constructor(private readonly myService: MyService) {}

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.myService.findAllForUser(userId);
  }

  @Post()
  create(@GetUser('id') userId: string, @Body() dto: CreateItemDto) {
    return this.myService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.myService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.myService.remove(userId, id);
  }
}
```

Key conventions:
- `@UseGuards(JwtAuthGuard)` at controller level for all routes
- `@GetUser('id')` custom decorator extracts userId from JWT
- `@HttpCode(204)` on DELETE endpoints
- DTOs on `@Body()` for automatic validation

## 5. Module

File: `server/src/<feature>/<feature>.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MyEntity]),
    OtherModule,        // for injecting OtherService
    AnthropicModule,    // if using AI
  ],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],  // if other modules need this service
})
export class MyModule {}
```

Then register in `server/src/app.module.ts`:
```typescript
imports: [..., MyModule],
```

## Shared types

Shared enums and types live in `shared/enums.ts` (imported as `@shared/enums` via path alias). Add new shared types there, not in the service files.
