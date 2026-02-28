import {
  getTodayDayOfWeek,
  getCurrentWeekStartDate,
  getWeekStartDateForDay,
  orderedDaysFrom,
} from './dayOfWeek';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getTodayDayOfWeek', () => {
  it.each([
    // [dateString,  expected JS-native day (0=Sun)]
    ['2026-03-01', 0], // Sunday
    ['2026-02-23', 1], // Monday
    ['2026-02-24', 2], // Tuesday
    ['2026-02-25', 3], // Wednesday
    ['2026-02-26', 4], // Thursday
    ['2026-02-27', 5], // Friday
    ['2026-02-28', 6], // Saturday
  ])('returns %i for %s', (dateStr, expected) => {
    jest.setSystemTime(new Date(`${dateStr}T12:00:00`));
    expect(getTodayDayOfWeek()).toBe(expected);
  });
});

describe('getCurrentWeekStartDate', () => {
  it.each([
    // [today,        expected Sunday]
    ['2026-03-01', '2026-03-01'], // Sunday → same day
    ['2026-02-23', '2026-02-22'], // Monday → previous Sunday
    ['2026-02-24', '2026-02-22'], // Tuesday
    ['2026-02-25', '2026-02-22'], // Wednesday
    ['2026-02-26', '2026-02-22'], // Thursday
    ['2026-02-27', '2026-02-22'], // Friday
    ['2026-02-28', '2026-02-22'], // Saturday
  ])('when today is %s returns %s', (today, expectedSunday) => {
    jest.setSystemTime(new Date(`${today}T12:00:00`));
    expect(getCurrentWeekStartDate()).toBe(expectedSunday);
  });

  it('handles month boundary (Monday in March, Sunday in February)', () => {
    jest.setSystemTime(new Date('2026-03-02T12:00:00')); // Monday
    expect(getCurrentWeekStartDate()).toBe('2026-03-01'); // Sunday Mar 1
  });

  it('handles year boundary (Thursday Jan 1 → Sunday Dec 28)', () => {
    jest.setSystemTime(new Date('2026-01-01T12:00:00'));
    expect(getCurrentWeekStartDate()).toBe('2025-12-28');
  });

  it('handles Sunday at start of year', () => {
    jest.setSystemTime(new Date('2026-01-04T12:00:00')); // Sunday
    expect(getCurrentWeekStartDate()).toBe('2026-01-04');
  });
});

describe('getWeekStartDateForDay', () => {
  it('returns today when today matches startDay', () => {
    jest.setSystemTime(new Date('2026-02-25T12:00:00')); // Wednesday (3)
    expect(getWeekStartDateForDay(3)).toBe('2026-02-25');
  });

  it('returns the next occurrence of startDay', () => {
    jest.setSystemTime(new Date('2026-02-25T12:00:00')); // Wednesday (3)
    // Next Monday (1) = (1-3+7)%7 = 5 days → Mar 2
    expect(getWeekStartDateForDay(1)).toBe('2026-03-02');
  });

  it('returns next Sunday when today is Saturday', () => {
    jest.setSystemTime(new Date('2026-02-28T12:00:00')); // Saturday (6)
    expect(getWeekStartDateForDay(0)).toBe('2026-03-01');
  });
});

describe('orderedDaysFrom', () => {
  it('returns days starting from Monday', () => {
    expect(orderedDaysFrom(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('returns days starting from Sunday', () => {
    expect(orderedDaysFrom(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns days starting from Wednesday', () => {
    expect(orderedDaysFrom(3)).toEqual([3, 4, 5, 6, 0, 1, 2]);
  });
});
