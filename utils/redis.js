const { createClient } = require('redis');
const { promisify } = require('util');

// Define class to handle Redis client operations
class RedisClient {
  constructor() {
    // Create new Redis client instance
    this.client = createClient();

    // Set initial connection status
    this.client.connected = true;

    // Handle Redis client errors
    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    // Handle Redis client successful connection
    this.client.on('connect', () => {
      this.client.connected = true;
    });

    // Promisify Redis client methods to use async/await syntax
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Check if the Redis client is connected
  isAlive() {
    return this.client.connected;
  }

  // Get value from Redis by key
  async get(key) {
    return this.getAsync(key);
  }

  // Set value in Redis with an expiration time
  async set(key, value, duration) {
    await this.setexAsync(key, duration, value);
  }

  // Delete value from Redis by key
  async del(key) {
    await this.delAsync(key);
  }
}

// Export instance of RedisClient for use in other modules
export const redisClient = new RedisClient();
export default redisClient;
