import { getTodayDayOfWeek, getCurrentWeekStartDate } from './dayOfWeek';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getTodayDayOfWeek', () => {
  it.each([
    // [dateString,  expected backend DayOfWeek]
    ['2026-02-23', 0], // Monday
    ['2026-02-24', 1], // Tuesday
    ['2026-02-25', 2], // Wednesday
    ['2026-02-26', 3], // Thursday
    ['2026-02-27', 4], // Friday
    ['2026-02-28', 5], // Saturday
    ['2026-03-01', 6], // Sunday
  ])('returns %i for %s', (dateStr, expected) => {
    jest.setSystemTime(new Date(`${dateStr}T12:00:00`));
    expect(getTodayDayOfWeek()).toBe(expected);
  });
});

describe('getCurrentWeekStartDate', () => {
  it.each([
    // [today,        expected Monday]
    ['2026-02-23', '2026-02-23'], // Monday → same day
    ['2026-02-24', '2026-02-23'], // Tuesday
    ['2026-02-25', '2026-02-23'], // Wednesday
    ['2026-02-26', '2026-02-23'], // Thursday
    ['2026-02-27', '2026-02-23'], // Friday
    ['2026-02-28', '2026-02-23'], // Saturday
    ['2026-03-01', '2026-02-23'], // Sunday
  ])('when today is %s returns %s', (today, expectedMonday) => {
    jest.setSystemTime(new Date(`${today}T12:00:00`));
    expect(getCurrentWeekStartDate()).toBe(expectedMonday);
  });

  it('handles month boundary (Sunday in March, Monday in February)', () => {
    jest.setSystemTime(new Date('2026-03-01T12:00:00'));
    expect(getCurrentWeekStartDate()).toBe('2026-02-23');
  });

  it('handles year boundary (Thursday Jan 1 → Monday Dec 29)', () => {
    jest.setSystemTime(new Date('2026-01-01T12:00:00'));
    expect(getCurrentWeekStartDate()).toBe('2025-12-29');
  });

  it('handles leap year (Saturday Feb 29)', () => {
    jest.setSystemTime(new Date('2028-02-29T12:00:00'));
    expect(getCurrentWeekStartDate()).toBe('2028-02-28');
  });

  it('handles Monday at start of year', () => {
    jest.setSystemTime(new Date('2026-01-05T12:00:00'));
    expect(getCurrentWeekStartDate()).toBe('2026-01-05');
  });
});
