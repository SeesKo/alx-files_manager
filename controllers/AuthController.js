import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  // GET /connect endpoint
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [scheme, credentials] = authHeader.split(' ');
    if (scheme !== 'Basic') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400); // 24 hours

      return res.status(200).json({ token });
    } catch (err) {
      console.error('Error connecting user:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /disconnect endpoint
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(`auth_${token}`);

      return res.status(204).send();
    } catch (err) {
      console.error('Error disconnecting user:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
