export type Me = {
  id: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
  unit: 'lbs' | 'kg';
  onboarded: boolean;
};

export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  value: number; // in user's current unit
};

export type WeightsResponse = {
  unit: 'lbs' | 'kg';
  weights: WeightEntry[];
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getMe(): Promise<Me | null> {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (res.status === 401) return null;
  return json<Me>(res);
}

export async function updateMe(fields: {
  unit?: 'lbs' | 'kg';
  onboarded?: boolean;
}): Promise<Me> {
  const res = await fetch('/api/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  return json<Me>(res);
}

export async function getWeights(days: number): Promise<WeightsResponse> {
  const res = await fetch(`/api/weights?days=${days}`, { credentials: 'include' });
  return json<WeightsResponse>(res);
}

export async function postWeight(value: number, date?: string): Promise<WeightEntry> {
  const res = await fetch('/api/weights', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value, date }),
  });
  return json<WeightEntry>(res);
}

export async function logout(): Promise<void> {
  await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
}
