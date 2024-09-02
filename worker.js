import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

// Initialize Bull Queues
const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

// Process the fileQueue for generating thumbnails
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  // Fetch file document from DB
  const fileDocument = await dbClient.db.collection('files')
    .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!fileDocument) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  const sizes = [500, 250, 100];
  const promises = sizes.map(async (size) => {
    const thumbnailPath = `${fileDocument.localPath}_${size}`;
    const options = { width: size };
    const thumbnail = await imageThumbnail(fileDocument.localPath, options);
    fs.writeFileSync(thumbnailPath, thumbnail);
  });

  await Promise.all(promises);
});

// Process the userQueue for sending welcome email
userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Fetch user document from DB
  const userDocument = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!userDocument) {
    throw new Error('User not found');
  }

  // Print welcome message
  console.log(`Welcome ${userDocument.email}!`);
});

// Default export with queues as properties
export default { fileQueue, userQueue };
