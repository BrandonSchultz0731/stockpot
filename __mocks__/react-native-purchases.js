module.exports = {
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', ERROR: 'ERROR' },
};
