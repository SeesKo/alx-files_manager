import express from 'express';
import { router } from './routes/index';

const app = express();

// Use PORT from environment or default to 5000
const port = process.env.PORT || 5000;

// Use the routes
app.use('/', router);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
