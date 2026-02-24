import { api, ApiError, setAccessToken } from './api';

// Mock the config module
jest.mock('../config', () => 'https://api.example.com');

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  setAccessToken(null);
});

describe('ApiError', () => {
  it('should construct with status and message', () => {
    const err = new ApiError(404, 'Not found');

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
  });
});

describe('setAccessToken', () => {
  it('should include Authorization header after setting token', async () => {
    setAccessToken('my-token');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 1 }),
    });

    await api.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      }),
    );
  });

  it('should not include Authorization header when token is null', async () => {
    setAccessToken(null);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.get('/test');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe('api.get', () => {
  it('should make GET request to correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    });

    const result = await api.get('/users/me');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users/me',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual({ id: 1 });
  });
});

describe('api.post', () => {
  it('should make POST request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: 'abc' }),
    });

    await api.post('/auth/login', { email: 'a@b.com', password: 'p' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'p' }),
      }),
    );
  });

  it('should handle POST without body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api.post('/auth/logout');

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.body).toBeUndefined();
  });
});

describe('api.patch', () => {
  it('should make PATCH request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await api.patch('/users/me/onboarding', { data: 'value' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users/me/onboarding',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ data: 'value' }),
      }),
    );
  });
});

describe('204 No Content handling', () => {
  it('should return undefined for 204 responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await api.post('/auth/logout');

    expect(result).toBeUndefined();
  });
});

describe('error handling', () => {
  it('should throw ApiError with NestJS string message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    });

    await expect(api.post('/auth/login', {})).rejects.toThrow(ApiError);
    try {
      await api.post('/auth/login', {});
    } catch (e: any) {
      expect(e.status).toBe(401);
      expect(e.message).toBe('Invalid credentials');
    }
  });

  it('should join NestJS array messages', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: ['email must be an email', 'password is required'],
        }),
    });

    try {
      await api.post('/auth/register', {});
    } catch (e: any) {
      expect(e.message).toBe(
        'email must be an email, password is required',
      );
    }
  });

  it('should fallback to generic message when JSON parsing fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    try {
      await api.get('/broken');
    } catch (e: any) {
      expect(e.message).toBe('Request failed (500)');
      expect(e.status).toBe(500);
    }
  });
});
