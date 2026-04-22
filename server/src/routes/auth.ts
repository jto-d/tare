import { Router } from 'express';
import passport from 'passport';

export const authRouter = Router();

authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/?auth=failed`,
  }),
  (_req, res) => {
    res.redirect(process.env.CLIENT_URL ?? '/');
  }
);

authRouter.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('tare.sid');
      res.json({ ok: true });
    });
  });
});
