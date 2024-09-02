import dbClient from '../utils/db';

describe('dB Client', () => {
  it('should connect to MongoDB', () => {
    expect(dbClient.isAlive()).toBe(true);
  });

  it('should count users', async () => {
    const count = await dbClient.nbUsers();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should count files', async () => {
    const count = await dbClient.nbFiles();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
