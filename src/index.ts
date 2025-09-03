import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import seedData from './utils/seedData';

// Import routes
import authRoutes from './routes/auth';
import participantRoutes from './routes/participants';
import eventRoutes from './routes/events';
import entryRoutes from './routes/entries';
import userRoutes from './routes/users';
import logRoutes from './routes/logs';

// Load environment variables
dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
  }
});
app.use(limiter);

//למחוק זה רק זמני
seedData().then(() => {
  console.log("Database seeded successfully!");
}).catch(err => {
  console.error("Error seeding database:", err);
});


// CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://tishrei-entry-guardian.vercel.app',
];

// הגדרת CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: any) {
    if (!origin) return callback(null, true); // בקשות שלא מדפדפן (Postman, curl)
    const isVercelPreview = /^https:\/\/tishrei-entry-guardian-.*\.vercel\.app$/.test(origin);
    if (allowedOrigins.includes(origin) || isVercelPreview) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,  // לא להמשיך ל־route אחרי OPTIONS
  optionsSuccessStatus: 204, // סטטוס נכון ל־preflight
};

// הוספת ה‑middleware ל‑CORS לכל הבקשות
app.use(cors(corsOptions));

// טיפול אוטומטי בכל בקשות OPTIONS לכל הנתיבים
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'שגיאה פנימית בשרת'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer(); 