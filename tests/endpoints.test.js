import request from 'supertest';
import app from '../server';

describe('aPI Endpoints', () => {
  it('gET /status should return status', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  it('gET /stats should return stats', async () => {
    const response = await request(app).get('/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('files');
  });

  it('pOST /users should create a user', async () => {
    const response = await request(app).post('/users').send({
      username: 'testuser',
      password: 'password123',
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('gET /connect should return a token', async () => {
    const response = await request(app).get('/connect').set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('gET /disconnect should handle disconnection', async () => {
    const response = await request(app).get('/disconnect').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Disconnected');
  });

  it('gET /users/me should return user info', async () => {
    const response = await request(app).get('/users/me').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username');
  });

  it('pOST /files should upload a file', async () => {
    const response = await request(app).post('/files').set('X-Token', 'some_valid_token').attach('file', 'path/to/file.png');
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('gET /files/:id should get a file', async () => {
    const response = await request(app).get('/files/some_file_id').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
  });

  it('gET /files should handle pagination', async () => {
    const response = await request(app).get('/files?page=1&limit=10').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body.files.length).toBeLessThanOrEqual(10);
  });

  it('pUT /files/:id/publish should publish a file', async () => {
    const response = await request(app).put('/files/some_file_id/publish').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('isPublic', true);
  });

  it('pUT /files/:id/unpublish should unpublish a file', async () => {
    const response = await request(app).put('/files/some_file_id/unpublish').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('isPublic', false);
  });

  it('gET /files/:id/data should return file data', async () => {
    const response = await request(app).get('/files/some_file_id/data').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('gET /files/:id/data?size=100 should return thumbnail', async () => {
    const response = await request(app).get('/files/some_file_id/data?size=100').set('X-Token', 'some_valid_token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
