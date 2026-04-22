import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateUser, findUserById, type User } from './db.js';

declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}

export function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID || 'unconfigured';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'unconfigured';

  if (clientID === 'unconfigured' || clientSecret === 'unconfigured') {
    console.warn(
      '[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth will fail until you configure them in server/.env'
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: '/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google account has no email'));
          const user = await findOrCreateUser({
            googleId: profile.id,
            email,
            name: profile.displayName ?? null,
            pictureUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, { id: user.id });
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  passport.serializeUser<string>((user, done) => {
    done(null, (user as { id: string }).id);
  });

  passport.deserializeUser<string>(async (id, done) => {
    try {
      const user = await findUserById(id);
      if (!user) return done(null, false);
      done(null, { id: user.id });
    } catch (err) {
      done(err as Error);
    }
  });
}

export function requireAuth(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  next();
}

export async function loadUser(userId: string): Promise<User | null> {
  return findUserById(userId);
}
