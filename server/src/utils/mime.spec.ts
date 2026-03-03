import { normalizeImageMime } from './mime';

describe('normalizeImageMime', () => {
  it('normalizes image/jpg to image/jpeg', () => {
    expect(normalizeImageMime('image/jpg')).toBe('image/jpeg');
  });

  it('normalizes image/heic to image/jpeg', () => {
    expect(normalizeImageMime('image/heic')).toBe('image/jpeg');
  });

  it('normalizes image/heif to image/jpeg', () => {
    expect(normalizeImageMime('image/heif')).toBe('image/jpeg');
  });

  it('passes through image/jpeg unchanged', () => {
    expect(normalizeImageMime('image/jpeg')).toBe('image/jpeg');
  });

  it('passes through image/png unchanged', () => {
    expect(normalizeImageMime('image/png')).toBe('image/png');
  });

  it('passes through image/webp unchanged', () => {
    expect(normalizeImageMime('image/webp')).toBe('image/webp');
  });

  it('defaults to image/jpeg when undefined', () => {
    expect(normalizeImageMime(undefined)).toBe('image/jpeg');
  });

  it('defaults to image/jpeg when empty string', () => {
    expect(normalizeImageMime('')).toBe('image/jpeg');
  });
});
