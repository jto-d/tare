import { Router } from 'express';
import { requireAuth, loadUser } from '../auth.js';
import { listWeights, upsertWeight } from '../db.js';

const LBS_PER_KG = 2.2046226218;

function toKg(value: number, unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? value : value / LBS_PER_KG;
}

function fromKg(valueKg: number, unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? valueKg : valueKg * LBS_PER_KG;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export const weightsRouter = Router();

weightsRouter.get('/', requireAuth, async (req, res) => {
  const user = await loadUser(req.user!.id);
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const daysRaw = Number(req.query.days ?? 60);
  const days = Math.min(Math.max(Math.floor(daysRaw) || 60, 1), 365);
  const rows = await listWeights(user.id, days);

  res.json({
    unit: user.unit,
    weights: rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      value: +fromKg(Number(r.value_kg), user.unit).toFixed(1),
    })),
  });
});

weightsRouter.post('/', requireAuth, async (req, res) => {
  const user = await loadUser(req.user!.id);
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const { value, date } = req.body ?? {};
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1500) {
    return res.status(400).json({ error: 'value must be a positive number (<= 1500)' });
  }
  const entryDate: string = date ?? new Date().toISOString().slice(0, 10);
  if (!isValidDate(entryDate)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }

  const valueKg = toKg(value, user.unit);
  const saved = await upsertWeight(user.id, valueKg, entryDate);
  res.json({
    id: saved.id,
    date: saved.entry_date,
    value: +fromKg(Number(saved.value_kg), user.unit).toFixed(1),
  });
});
