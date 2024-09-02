import redisClient from '../utils/redis';

const { set, get, del } = redisClient;

describe('redis Client', () => {
  beforeAll(async () => {
    await redisClient.set('test_key', 'test_value', 3600);
  });

  it('should set and get a value', async () => {
    await set('key', 'value', 3600);
    const value = await get('key');
    expect(value).toBe('value');
  });

  it('should delete a value', async () => {
    await del('key');
    const value = await get('key');
    expect(value).toBeNull();
  });
});
