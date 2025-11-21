import express, {
  NextFunction,
  Request,
  Response,
} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs';
import applicationsRouter from './routes/applications';
import aiRouter from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const start = process.hrtime.bigint();
  const bodyPreview = JSON.stringify(req.body ?? {});
  console.log('[BACKEND][REQUEST]', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    body:
      bodyPreview.length > 1000
        ? `${bodyPreview.slice(0, 1000)}…(truncated)`
        : bodyPreview,
  });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    console.log('[BACKEND][RESPONSE]', {
      requestId,
      status: res.statusCode,
      durationMs: durationMs.toFixed(3),
      contentLength: res.getHeader('content-length') ?? 'unknown',
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/ai', aiRouter);

// Error handling middleware
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[BACKEND][ERROR]', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Something went wrong!' });
  },
);

// Start server
app.listen(PORT, () => {
  console.log('[BACKEND][STARTUP]', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    aiServiceBaseUrl: process.env.AI_SERVICE_BASE_URL ??
      'http://localhost:4001/api/ai',
  });
});

export default app;
