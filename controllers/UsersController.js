import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const { db } = dbClient;

    // Check if the email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Create the new user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    // Return the new user with ID and email
    const newUser = result.ops[0];
    return res.status(201).json({ id: newUser._id.toString(), email: newUser.email });
  }
}

export default UsersController;
