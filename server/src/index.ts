import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import { configurePassport } from './auth.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { weightsRouter } from './routes/weights.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PgStore = connectPgSimple(session);
const app = express();
const isProd = process.env.NODE_ENV === 'production';

configurePassport();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    store: new PgStore({ pool, tableName: 'session' }),
    name: 'tare.sid',
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/weights', weightsRouter);

if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[tare] server on http://localhost:${port}`);
});
