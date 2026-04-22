import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export type User = {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  picture_url: string | null;
  unit: 'lbs' | 'kg';
  onboarded: boolean;
  created_at: Date;
};

export type Weight = {
  id: string;
  user_id: string;
  value_kg: string; // numeric comes back as string from pg
  entry_date: string; // 'YYYY-MM-DD'
  created_at: Date;
};

export async function findOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
}): Promise<User> {
  const existing = await pool.query<User>(
    'SELECT * FROM users WHERE google_id = $1',
    [profile.googleId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await pool.query<User>(
    `INSERT INTO users (google_id, email, name, picture_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [profile.googleId, profile.email, profile.name, profile.pictureUrl]
  );
  return inserted.rows[0];
}

export async function findUserById(id: string): Promise<User | null> {
  const r = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return r.rows[0] ?? null;
}

export async function updateUser(
  id: string,
  fields: { unit?: 'lbs' | 'kg'; onboarded?: boolean }
): Promise<User> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.unit !== undefined) {
    sets.push(`unit = $${sets.length + 1}`);
    values.push(fields.unit);
  }
  if (fields.onboarded !== undefined) {
    sets.push(`onboarded = $${sets.length + 1}`);
    values.push(fields.onboarded);
  }
  if (sets.length === 0) {
    const u = await findUserById(id);
    if (!u) throw new Error('user not found');
    return u;
  }
  values.push(id);
  const r = await pool.query<User>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return r.rows[0];
}

export async function listWeights(userId: string, days: number): Promise<Weight[]> {
  const r = await pool.query<Weight>(
    `SELECT id, user_id, value_kg, to_char(entry_date, 'YYYY-MM-DD') AS entry_date, created_at
     FROM weights
     WHERE user_id = $1 AND entry_date >= CURRENT_DATE - ($2::int - 1)
     ORDER BY entry_date ASC`,
    [userId, days]
  );
  return r.rows;
}

export async function upsertWeight(
  userId: string,
  valueKg: number,
  entryDate: string
): Promise<Weight> {
  const r = await pool.query<Weight>(
    `INSERT INTO weights (user_id, value_kg, entry_date)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, entry_date)
     DO UPDATE SET value_kg = EXCLUDED.value_kg
     RETURNING id, user_id, value_kg, to_char(entry_date, 'YYYY-MM-DD') AS entry_date, created_at`,
    [userId, valueKg, entryDate]
  );
  return r.rows[0];
}
