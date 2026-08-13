import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { CLIENT_ORIGINS, JSON_BODY_LIMIT } from './config/env.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
}));
app.use(hpp());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

export default app;
