# Ganbatte Technical Guide

This document contains setup, architecture, deployment, and implementation details for contributors and maintainers.

## Technology Stack

- Frontend: React 18, Vite, Socket.io Client
- Backend: Node.js, Express.js, Socket.io
- Validation: Zod
- Server middleware: Helmet, CORS, HPP, rate limiting, payload limits
- Runtime: Node.js and npm
- Deployment: Vercel-compatible client and Render-compatible server

## Project Structure

```text
Ganbatte/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── config.js
│       ├── assets/logo.svg
│       ├── components/
│       │   ├── layout/AppHeader.jsx
│       │   ├── AuthPage.jsx
│       │   ├── KanjiStudy.jsx
│       │   ├── RoomSelector.jsx
│       │   ├── RoomLobby.jsx
│       │   ├── Assessment.jsx
│       │   └── Results.jsx
│       ├── services/api.js
│       ├── config/supabase.js
│       └── utils/romaji.js
├── server/
│   ├── index.js
│   ├── app.js
│   ├── package.json
│   ├── config/env.js
│   ├── config/supabase.js
│   ├── config/redis.js
│   ├── database/migrations/001_create_kana_sentences.sql
│   ├── database/migrations/002_create_profiles.sql
│   ├── database/migrations/003_create_assessment_results.sql
│   ├── data/kana-sentences.js
│   ├── data/kanji.js
│   ├── repositories/kana-sentence-repository.js
│   ├── services/card-service.js
│   └── utils/validation.js
├── .github/copilot-instructions.md
└── package.json
```

## Requirements

- Node.js 18 or newer
- npm

## Installation

From the repository root:

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

## Local Development

Start the server and client together:

```bash
npm run dev
```

Default local URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

Run either side independently:

```bash
npm run server:dev
npm run client:dev
```

## Client Environment

The client reads the server URL from `VITE_SERVER_URL`.

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
```

For a deployed client:

```env
VITE_SERVER_URL=https://your-server.onrender.com
```

The repository includes `client/.env.example`. The client falls back to the browser origin when the variable is not set.

## Authentication Setup

The client uses Supabase Auth with the publishable/anon key. The service role key remains server-only.

Add these variables to `client/.env` for local development and to the Vercel project for deployment:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Run `server/database/migrations/002_create_profiles.sql` after the sentence migration. It creates a `profiles` table linked to `auth.users` and automatically creates a profile from the signup name.

In Supabase Auth settings, configure the site URL and redirect URLs for the local client and deployed Vercel client. If email confirmation is enabled, users must confirm their email before entering the app.

## Deployment

### Server on Render

Configure a Render web service with:

- Root directory: `server`
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/health`
- `CLIENT_ORIGINS`: comma-separated allowed client origins
- `REDIS_URL`: Redis connection URL for shared Socket.io rooms

The server build command runs `node --check index.js` because the backend is plain JavaScript and does not require compilation.

### Client on Vercel

Configure the Vercel project with:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- `VITE_SERVER_URL`: the public Render server URL

## Supabase Setup

The initial Supabase infrastructure is server-only and uses the service role key. Never add the service role key to the client or commit it to Git.

1. Create a Supabase project.
2. Run `server/database/migrations/001_create_kana_sentences.sql` in the Supabase SQL Editor.
3. Add these environment variables to the server service:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The repository currently exposes `getRandomKanaSentences()` as the database access boundary. Existing in-memory sentence generation remains active until the Supabase table is seeded and room generation is switched to the repository.

## Dataset and Randomization

Sentence records are stored in `server/data/kana-sentences.js`.

The current dataset is generated from independent beginner vocabulary dimensions:

- 20 subjects
- 15 everyday places
- 20 activities
- 6,000 unique sentence combinations

`server/services/card-service.js` selects random records without duplicates within a deck. New rooms and the card-generation endpoint each receive a random set of 10 prompts.

## Romaji and Scoring

- Answers are case-insensitive.
- Whitespace is ignored during normalization.
- `wo` is normalized to `o`.
- Romaji is tokenized using `client/src/utils/romaji.js`.
- Each expected token is worth one possible point.
- A token receives credit when it matches the expected token at the same position.
- The percentage is calculated from matched tokens over expected tokens.
- A question is fully correct only when all expected tokens match.
- Difference review aligns matching tokens and highlights actual submitted or expected differences, including separated errors.

## API Endpoints

- `GET /health` - Health check for deployment monitoring.
- `GET /api/kana-cards` - Returns a random deck of 10 sentence cards.
- `GET /api/kanji-cards` - Returns grouped Kanji study cards.
- `POST /api/generate-cards?count=10` - Generates a random deck with 1-25 cards.
- `GET /api/rooms/:code` - Returns the current room state.
- Assessment history is stored in Supabase by the authenticated client after a completed assessment.

## Socket Events

Client to server:

- `create-room`
- `join-room`
- `get-room`
- `set-cards`
- `start-assessment`
- `submit-answer`
- `player-ready`

Server to client:

- `room-created`
- `player-joined`
- `cards-updated`
- `assessment-started`
- `answer-submitted`
- `both-submitted`
- `player-ready-updated`
- `card-updated`
- `assessment-completed`
- `player-left`

## Scripts

Root:

```bash
npm run dev
npm run server:dev
npm run client:dev
npm run build
npm start
```

Server:

```bash
npm run dev
npm run build
npm start
```

Client:

```bash
npm run dev
npm run build
npm run preview
```

## Customization

- Add vocabulary dimensions or sentence templates in `server/data/kana-sentences.js`.
- Add or update Kanji study records in `server/data/kanji.js`.
- Adjust random deck selection in `server/services/card-service.js`.
- Adjust scoring and difference behavior in `client/src/utils/romaji.js`.
- Update the logo in `client/src/assets/logo.svg`.
- Customize the visual theme in the CSS files under `client/src/`.
