import { MongoClient } from 'mongodb';

// Define a class for handling MongoDB operations
class DBClient {
  constructor() {
    // Set up MongoDB connection details and create a client instance
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null;

    // Connect to MongoDB and handle connection errors
    this.client.connect()
      .then((client) => {
        this.db = client.db(database);
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
      });
  }

  // Check if the database connection is active
  isAlive() {
    return !!this.db;
  }

  // Get the number of documents in the 'users' collection
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.db.collection('users').countDocuments();
  }

  // Get the number of documents in the 'files' collection
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.db.collection('files').countDocuments();
  }
}

// Export an instance of DBClient for use in other modules
export const dbClient = new DBClient();
export default dbClient;
