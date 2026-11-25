const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const requestRoutes = require('./routes/requests');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'onestep-api' }));
app.get('/api/ready', (_req, res) => res.json({ status: 'ready' }));
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);

app.use((err, _req, res, _next) => {
  if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid request data', details: err.issues });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
module.exports = app;
