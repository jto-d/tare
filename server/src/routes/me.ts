import { Router } from 'express';
import { requireAuth, loadUser } from '../auth.js';
import { updateUser } from '../db.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (req, res) => {
  const user = await loadUser(req.user!.id);
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    pictureUrl: user.picture_url,
    unit: user.unit,
    onboarded: user.onboarded,
  });
});

meRouter.patch('/', requireAuth, async (req, res) => {
  const { unit, onboarded } = req.body ?? {};
  if (unit !== undefined && unit !== 'lbs' && unit !== 'kg') {
    return res.status(400).json({ error: 'unit must be lbs or kg' });
  }
  if (onboarded !== undefined && typeof onboarded !== 'boolean') {
    return res.status(400).json({ error: 'onboarded must be boolean' });
  }
  const user = await updateUser(req.user!.id, { unit, onboarded });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    pictureUrl: user.picture_url,
    unit: user.unit,
    onboarded: user.onboarded,
  });
});
