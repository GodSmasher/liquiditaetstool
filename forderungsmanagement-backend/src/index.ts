import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import receivablesRoutes from './routes/receivables';
import syncRoutes from './routes/sync';
import logger from './utils/logger';
import { startCronJobs } from './jobs/syncJob';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Forderungsmanagement API',
    version: '1.0.0',
    endpoints: {
      receivables: '/api/receivables',
      status: '/api/receivables/status',
      health: '/health',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/receivables', receivablesRoutes);
app.use('/api/sync', syncRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized');

    // Start cron jobs
    startCronJobs();
    logger.info('Cron jobs started');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 API: http://localhost:${PORT}/api/receivables`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

