export class JwksClient {
  constructor(_options: any) {}
  getSigningKey = jest.fn().mockResolvedValue({
    getPublicKey: () => 'mock-public-key',
  });
}
