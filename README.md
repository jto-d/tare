# tare

A simple weight tracking app. Log your weight every morning, watch the pattern.

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + Passport (Google OAuth 2.0)
- **Database**: Postgres (Neon) with session cookies stored in the DB
- **Design**: mobile-first, cream + mocha palette

## Layout

```
tare/
├── client/     # Vite React app (port 5173)
└── server/     # Express API (port 3001)
```

## Prerequisites

- Node 20+
- A Google OAuth 2.0 client (see below)
- A Postgres database (a Neon instance has already been provisioned — connection string is in `server/.env`)

## Setup

### 1. Create Google OAuth credentials

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Create a new project (or pick one).
3. Configure the OAuth consent screen (External, fill in app name + support email).
4. **Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy the **Client ID** and **Client secret**.

### 2. Configure env vars

Edit `server/.env` and fill in:

```
GOOGLE_CLIENT_ID=<your client id>
GOOGLE_CLIENT_SECRET=<your client secret>
SESSION_SECRET=<run: openssl rand -hex 32>
```

`DATABASE_URL` is already populated with the Neon connection string.

### 3. Install and run

```bash
# server
cd server
npm install
npm run dev        # http://localhost:3001

# client (in another terminal)
cd client
npm install
npm run dev        # http://localhost:5173
```

Open <http://localhost:5173>. Vite proxies `/api/*` and `/auth/*` to the server, so cookies work same-origin.

## Database schema

The Neon database already has the required tables. If you want to recreate them elsewhere:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture_url TEXT,
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('lbs', 'kg')),
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value_kg NUMERIC(6,3) NOT NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX weights_user_date_idx ON weights (user_id, entry_date DESC);

-- session table (used by connect-pg-simple)
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX session_expire_idx ON session (expire);
```

Weights are always stored in **kilograms** internally and converted on the way in/out based on the user's preferred unit, so toggling units in Settings never loses precision.

## API

All `/api/*` routes require a valid session cookie.

| Method | Path                   | Purpose                                           |
| ------ | ---------------------- | ------------------------------------------------- |
| GET    | `/auth/google`         | Start OAuth (redirects to Google)                 |
| GET    | `/auth/google/callback`| OAuth callback; on success, redirects to client   |
| POST   | `/auth/logout`         | Destroy session                                   |
| GET    | `/api/me`              | Current user (401 if not logged in)               |
| PATCH  | `/api/me`              | Update `unit` and/or `onboarded`                  |
| GET    | `/api/weights?days=60` | Recent entries in the user's unit                 |
| POST   | `/api/weights`         | Upsert today's (or `date`) weight                 |

## Deployment notes

For production:

- Set `NODE_ENV=production` on the server so cookies are flagged `secure`.
- Host the client build (`npm run build` in `client/`) on the same origin as the server, or update `CLIENT_URL` and the Google OAuth redirect URI.
- Rotate `SESSION_SECRET`.
