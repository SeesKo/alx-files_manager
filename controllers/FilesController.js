import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import mime from 'mime-types';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

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

    try {
      const fileDocument = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
      if (!fileDocument) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.json({
        id: fileDocument._id,
        userId: fileDocument.userId,
        name: fileDocument.name,
        type: fileDocument.type,
        isPublic: fileDocument.isPublic,
        parentId: fileDocument.parentId,
        localPath: fileDocument.localPath,
      });
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0'; // Default to root if no parentId is provided
    const page = parseInt(req.query.page, 10) || 0; // Default to page 0 if not specified
    const limit = 20; // Number of files per page
    const skip = page * limit; // Calculate the number of documents to skip for pagination

    try {
      const files = await dbClient.db.collection('files')
        .aggregate([
          { $match: { parentId: parentId === '0' ? '0' : ObjectId(parentId), userId: ObjectId(userId) } },
          { $skip: skip },
          { $limit: limit },
        ])
        .toArray();

      const formattedFiles = files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
        localPath: file.localPath,
      }));

      return res.json(formattedFiles);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const fileDocument = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
      if (!fileDocument) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update the file document to set isPublic to true
      await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });

      return res.status(200).json({
        id: fileDocument._id,
        userId: fileDocument.userId,
        name: fileDocument.name,
        type: fileDocument.type,
        isPublic: true,
        parentId: fileDocument.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    // Check if user is authenticated
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const fileDocument = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
      if (!fileDocument) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update the file document to set isPublic to false
      await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });

      return res.status(200).json({
        id: fileDocument._id,
        userId: fileDocument.userId,
        name: fileDocument.name,
        type: fileDocument.type,
        isPublic: false,
        parentId: fileDocument.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    // Retrieve user ID from Redis
    const userId = await redisClient.get(`auth_${token}`);

    try {
      // Fetch the file document from the database
      const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });

      // Handle scenarios where file document does not exist
      if (!fileDocument) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if file is not public and no user is authenticated or user is not the owner
      if (!fileDocument.isPublic && (!userId || fileDocument.userId.toString() !== userId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the file type is a folder
      if (fileDocument.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // Check if the file exists locally
      if (!fileDocument.localPath || !fs.existsSync(fileDocument.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get MIME type based on the file name
      const mimeType = mime.lookup(fileDocument.name) || 'application/octet-stream';

      // Read the content of the file
      const fileContent = await readFileAsync(fileDocument.localPath);

      // Return the content of the file with the correct MIME type
      res.setHeader('Content-Type', mimeType);
      return res.send(fileContent);
    } catch (error) {
      console.error('Error fetching file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
