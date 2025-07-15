import * as oauthUtils from './oauthUtilities';
import OAuthClient from 'intuit-oauth';

jest.mock('../models/oauthTokenModel', () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  getLatestToken: jest.fn(),
  updateToken: jest.fn(),
}));
jest.mock('./errorHandler', () => jest.fn((fn, ...args) => fn(...args.slice(2))));

const { getToken, saveToken, getLatestToken, updateToken } = require('../models/oauthTokenModel');
const errorHandle = require('./errorHandler');

describe('oauthUtilities', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, QB_CLIENT_ID: 'id', QB_CLIENT_SECRET: 'secret', QB_ENV: 'sandbox', QB_REDIRECT_URL: 'http://localhost' };
    getLatestToken.mockResolvedValue({
      auth_token: "eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwieC5vcmciOiJIMCJ9..WJ58DyaTosIgNMd1ORiVQw.tUUF5SFEXJcHY8gEAT_gDYGmMdZRXYhh4kx6KaXSZk-zW3P5CQ1J5-nOmlJy8-g07b2h-Rvr4qFccWd0Wj-E2KruMP5SGOHS7mSjPi9stpZv5Ij-TsBCq8yUJjeOnFuTwyw5joU_IYLLxlQ5Gk0-i9zX41KvOaXANuI72KLITWtqgbZLSN8ga4AyhuOeByK8rNSy-Ln4NJCopBEVudnysyyGZwZD04kw2PS5YrMksVP0k6_H4PClL0z8eM13ZJVli1v7klWQWlxK6_XjUeqWuSwviSlT4l-btkjnULjaNMUKdt5L_G2q6Q_1Q2B7tt7uP4ifzmOp2qKrAndncVBE3Emu-0-swM5Q9X6iYrNvjpj0hW8wr2LylgbLQFz67zvo7aiouNGenTqHH_zZR3O9Hy56JsWiS2ib0lXa-CAv3gm4mN3tiSLKnGt_K2KvXYla9uu59Tljh13AcnhPss6deURvLhWLK1NwyWs0P4qKMfs.RFQ5Aim_mrYGvjRbzDEPfA",
      refresh_token: "RT1-105-H0-1761304263iffgh2y7b188l4vf21ls",
      datetime: new Date().toISOString(),
    });
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getBaseClient', () => {
    it('should create an OAuthClient with env vars', async () => {
      const client = await oauthUtils.getBaseClient();
      expect(client).toBeInstanceOf(OAuthClient);
      // Optionally, check client properties if accessible
    });
  });

  describe('getStoredTokens', () => {
    it('should return token if present', async () => {
      getLatestToken.mockResolvedValue({ auth_token: 'a', refresh_token: 'r' });
      const tokens = await oauthUtils.getStoredTokens('acct');
      expect(tokens[0].auth_token).toBe('a');
    });
    it('should throw if missing', async () => {
      getLatestToken.mockResolvedValue(undefined);
      await expect(oauthUtils.getStoredTokens('acct')).rejects.toThrow('TOKEN MISSING');
    });
    it('should throw if missing fields', async () => {
      getLatestToken.mockResolvedValue({});
      await expect(oauthUtils.getStoredTokens('acct')).rejects.toThrow('TOKEN MISSING');
    });
  });

  describe('oauthService', () => {
    it('should set tokens on OAuthClient', async () => {
      const mockClient = { token: {} };
      jest.spyOn(oauthUtils, 'getBaseClient').mockResolvedValue(mockClient as any);
      getLatestToken.mockResolvedValue({ auth_token: 'a', refresh_token: 'r' });
      const client = await oauthUtils.oauthService('acct');
      expect(client.token.access_token).toBe('a');
      expect(client.token.refresh_token).toBe('r');
    });
  });

  describe('getApiUrl', () => {
    it('should return sandbox url', async () => {
      process.env.QB_ENV = 'sandbox';
      expect(await oauthUtils.getApiUrl({} as any)).toBe('https://sandbox-accounts.platform.intuit.com');
    });
    it('should return production url', async () => {
      process.env.QB_ENV = 'production';
      expect(await oauthUtils.getApiUrl({} as any)).toBe('https://accounts.platform.intuit.com');
    });
  });

  describe('writeStoredRefreshToken', () => {
    it('should update token if latest found', async () => {
      getLatestToken.mockResolvedValue({ datetime: 'dt' });
      updateToken.mockResolvedValue(true);
      await expect(oauthUtils.writeStoredRefreshToken('r', 'a', 'acct')).resolves.toBe(true);
      expect(updateToken).toHaveBeenCalledWith({
        account: 'acct',
        datetime: 'dt',
        auth_token: 'a',
        refresh_token: 'r',
      });
    });
    it('should return false if error', async () => {
      getLatestToken.mockResolvedValue(undefined);
      await expect(oauthUtils.writeStoredRefreshToken('r', 'a', 'acct')).resolves.toBe(false);
    });
  });

  describe('saveTokens', () => {
    it('should refresh and save tokens', async () => {
      jest.resetAllMocks(); // Ensure all mocks are reset for this test
      const mockClient = {
        refreshUsingToken: jest.fn().mockResolvedValue({
          getJson: () => ({ refresh_token: 'newr', access_token: 'newa' }),
        }),
        token: {},
      };
      jest.spyOn(oauthUtils, 'getBaseClient').mockResolvedValue(mockClient as any);
      jest.spyOn(oauthUtils, 'getStoredTokens').mockResolvedValue([
        { auth_token: 'a', refresh_token: 'r' }
      ]);
      jest.spyOn(oauthUtils, 'writeStoredRefreshToken').mockResolvedValue(true);
      const client = await oauthUtils.saveTokens('acct');
      expect(mockClient.refreshUsingToken).toHaveBeenCalledWith('r');
      expect(client.token.refresh_token).toBe('newr');
      expect(client.token.access_token).toBe('newa');
      expect(oauthUtils.writeStoredRefreshToken).toHaveBeenCalledWith('newr', 'newa', 'acct');
    });
  });
}); 