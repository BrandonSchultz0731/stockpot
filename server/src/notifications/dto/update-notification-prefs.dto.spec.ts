import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateNotificationPrefsDto } from './update-notification-prefs.dto';

function createDto(data: Record<string, unknown>): UpdateNotificationPrefsDto {
  return plainToInstance(UpdateNotificationPrefsDto, data);
}

describe('UpdateNotificationPrefsDto', () => {
  it('should pass with all valid fields', async () => {
    const dto = createDto({
      expiringItems: true,
      mealReminders: false,
      mealPlanNudge: true,
      mealReminderTime: '17:30',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with no fields (all optional)', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only one boolean field', async () => {
    const dto = createDto({ expiringItems: false });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with non-boolean expiringItems', async () => {
    const dto = createDto({ expiringItems: 'yes' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-boolean mealReminders', async () => {
    const dto = createDto({ mealReminders: 1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid time format', async () => {
    const dto = createDto({ mealReminderTime: '5:00 PM' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with time outside valid range', async () => {
    const dto = createDto({ mealReminderTime: '25:00' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with midnight time', async () => {
    const dto = createDto({ mealReminderTime: '00:00' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with 23:59 time', async () => {
    const dto = createDto({ mealReminderTime: '23:59' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
