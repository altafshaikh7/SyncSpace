const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const { errorHandler, notFound } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const chatRoutes = require('./routes/chat.routes');
const replayRoutes = require('./routes/replay.routes');
const documentRoutes = require('./routes/document.routes');
const fileRoutes = require('./routes/file.routes');
const executionRoutes = require('./routes/execution.routes');

const app = express();

/* =========================================================
   SECURITY & PERFORMANCE
========================================================= */

app.use(helmet());
app.use(compression());

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

/* =========================================================
   CORS
========================================================= */

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // e.g. Postman, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost origins during development
    if (
      process.env.NODE_ENV !== 'production' &&
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true);
    }

    // Allow configured frontend origins
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
      : [];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject unknown origins
    callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],
};

app.use(cors(corsOptions));

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(express.json({ limit: '100mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '100mb',
  })
);

app.use(cookieParser());

/* =========================================================
   MONGODB SANITIZATION
========================================================= */

app.use(mongoSanitize());

/* =========================================================
   ROOT API ROUTE
========================================================= */

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SyncSpace API is running',
    service: 'SyncSpace Backend',
    status: 'ok',
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SyncSpace API',
    timestamp: new Date().toISOString(),
    commit: process.env.RENDER_GIT_COMMIT || 'local',
  });
});

/* =========================================================
   ENVIRONMENT TEST
========================================================= */

app.get('/api/v1/test-env', (_req, res) => {
  res.json({
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME
      ? 'SET'
      : 'MISSING',

    cloudinary_api_key: process.env.CLOUDINARY_API_KEY
      ? 'SET'
      : 'MISSING',

    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET
      ? 'SET'
      : 'MISSING',

    mongo_uri: process.env.MONGO_URI
      ? 'SET'
      : 'MISSING',

    node_env: process.env.NODE_ENV,
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/users', userRoutes);

app.use('/api/v1/rooms', roomRoutes);

app.use('/api/v1/chat', chatRoutes);

app.use('/api/v1/replay', replayRoutes);

app.use('/api/v1/documents', documentRoutes);

app.use('/api/v1/files', fileRoutes);

app.use('/api/v1/execute', executionRoutes);

/* =========================================================
   ERROR HANDLING
========================================================= */

// Must remain AFTER all valid routes
app.use(notFound);

app.use(errorHandler);

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;