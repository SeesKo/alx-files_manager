import Bull from 'bull';
import sharp from 'sharp';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

// Initialize Bull Queue
const fileQueue = new Bull('fileQueue');

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
    await sharp(fileDocument.localPath).resize(size).toFile(thumbnailPath);
  });

  await Promise.all(promises);
});

export default fileQueue;
