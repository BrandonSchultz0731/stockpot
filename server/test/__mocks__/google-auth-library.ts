export class OAuth2Client {
  constructor(_clientId?: string) {}
  verifyIdToken = jest.fn().mockResolvedValue({
    getPayload: () => ({
      sub: 'google-sub-123',
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
    }),
  });
}
