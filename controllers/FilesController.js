import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentDocument = null;
    if (parentId !== 0) {
      parentDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentDocument) return res.status(400).json({ error: 'Parent not found' });
      if (parentDocument.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const userObjId = new ObjectId(userId);

    // Prepare the file object to be inserted
    const fileDocument = {
      userId: userObjId,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : ObjectId(parentId),
    };

    if (type === 'folder') {
      // Insert folder in DB
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    // Handle file and image types
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileId = uuidv4();
    const localPath = `${folderPath}/${fileId}`;

    // Create folder if not exists
    await mkdirAsync(folderPath, { recursive: true });

    // Save file data to local disk
    await writeFileAsync(localPath, Buffer.from(data, 'base64'));

    fileDocument.localPath = localPath;

    // Insert file in DB
    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the file in DB
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(id),
      userId: ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(file);
  }

  static async getIndex(req, res) {
    const { parentId = 0, page = 0 } = req.query;
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = 20; // Items per page
    const skip = parseInt(page, 10) * limit;

    // Retrieve files with pagination and filtering by parentId
    const files = await dbClient.db.collection('files').aggregate([
      { $match: { userId: ObjectId(userId), parentId: parentId === '0' ? '0' : ObjectId(parentId) } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    return res.json(files);
  }
}

export default FilesController;
