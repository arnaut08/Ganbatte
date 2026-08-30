# Ganbatte Technical Guide

This document contains setup, architecture, deployment, and implementation details for contributors and maintainers.

## Technology Stack

- Frontend: React 18, Vite, Socket.io Client, TypeScript (strict mode)
- Backend: Node.js, Express.js, Socket.io, TypeScript (strict mode)
- Validation: Zod
- Server middleware: Helmet, CORS, HPP, rate limiting, payload limits
- Runtime: Node.js and npm
- Deployment: Vercel-compatible client and Render-compatible server

## Project Structure

```text
Ganbatte/
├── client/
│   ├── index.html
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── App.css
│       ├── index.css
│       ├── config.ts
│       ├── assets/
│       │   └── logo.svg
│       ├── components/
│       │   ├── AppHome.tsx
│       │   ├── auth/
│       │   │   └── AuthPage.tsx
│       │   ├── common/
│       │   │   └── BackButton.tsx
│       │   ├── layout/
│       │   │   └── AppHeader.tsx
│       │   ├── learning/
│       │   │   ├── LearningScreen.tsx
│       │   │   ├── KanjiStudy.tsx
│       │   │   ├── AssessmentHistory.tsx
│       │   │   └── AssessmentLoadingScreen.tsx
│       │   ├── practice/
│       │   │   ├── PracticeScreen.tsx
│       │   │   ├── Assessment.tsx
│       │   │   ├── Assessment.css
│       │   │   ├── RoomLobby.tsx
│       │   │   ├── RoomLobby.css
│       │   │   ├── GrammarPractice.tsx
│       │   │   ├── Results.tsx
│       │   │   └── Results.css
│       │   ├── social/
│       │   │   └── FriendsPanel.tsx
│       │   └── ui/
│       │       ├── alert.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── checkbox.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── progress.tsx
│       │       ├── separator.tsx
│       │       ├── skeleton.tsx
│       │       ├── switch.tsx
│       │       └── table.tsx
│       ├── config/
│       │   └── supabase.ts
│       ├── contexts/
│       │   ├── AppContext.tsx
│       │   └── RoomContext.tsx
│       ├── hooks/
│       │   ├── useAppNavigation.ts
│       │   ├── useAuth.ts
│       │   ├── useFriends.ts
│       │   ├── useRoomManager.ts
│       │   ├── useRoomSocket.ts
│       │   └── useToast.ts
│       ├── lib/
│       │   └── utils.ts
│       ├── services/
│       │   └── api.ts
│       ├── types/
│       │   ├── base.ts
│       │   ├── index.ts
│       │   ├── learning.ts
│       │   ├── navigation.ts
│       │   ├── room.ts
│       │   ├── social.ts
│       │   └── toast.ts
│       └── utils/
│           ├── friendRefresh.ts
│           ├── grammarRoomSync.ts
│           ├── grammarScoring.ts
│           ├── kanaRecall.ts
│           ├── kanjiRecall.ts
│           ├── navigation.ts
│           ├── romaji.ts
│           ├── roomSession.ts
│           ├── roomStatus.ts
│           ├── statusTransitions.ts
│           └── *test.ts (co-located unit tests)
├── server/
│   ├── index.ts
│   ├── app.ts
│   ├── package.json
│   ├── config/
│   │   ├── env.ts
│   │   ├── redis.ts
│   │   └── supabase.ts
│   ├── controllers/
│   │   ├── assessment-controller.ts
│   │   ├── friend-controller.ts
│   │   └── game-controller.ts
│   ├── database/
│   │   └── migrations/
│   │       ├── 001_create_kana_sentences.sql
│   │       ├── 002_create_profiles.sql
│   │       ├── 003_create_assessment_results.sql
│   │       ├── 004_create_friendships.sql
│   │       └── 005_create_friend_requests.sql
│   ├── data/
│   │   ├── kana-sentences.ts
│   │   ├── kana.ts
│   │   └── kanji.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── error-handler.ts
│   ├── repositories/
│   │   ├── genki-lesson-repository.ts
│   │   ├── kana-repository.ts
│   │   ├── kana-sentence-repository.ts
│   │   └── kanji-repository.ts
│   ├── routes/
│   │   ├── assessment-routes.ts
│   │   ├── friend-routes.ts
│   │   ├── game-routes.ts
│   │   └── grammar-lesson-routes.ts
│   ├── services/
│   │   ├── card-service.ts
│   │   ├── friend-service.ts
│   │   ├── genki-grammar-service.ts
│   │   ├── genki-lesson-service.ts
│   │   └── kanji-service.ts
│   ├── socket/
│   │   └── socket-server.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── socket-events.ts
│   └── utils/
│       ├── romaji.ts
│       ├── socket-room-utils.ts
│       └── validation.ts
├── .github/
│   └── copilot-instructions.md
├── package.json
├── README.md
├── TECHNICAL.md
└── package.json
```

## Requirements

- Node.js 18 or newer
- npm

Both the client and server are fully TypeScript (strict mode). TypeScript is checked without emitting build artifacts, and both sides run through `tsx`, which executes the ESM TypeScript sources directly. The root `npm run typecheck` script type-checks both `client/tsconfig.json` and `server/tsconfig.json`.

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

## N5 Kanji Content

Kanji study content is generated server-side with Gemini and persisted as published records in Supabase. The browser and Socket.io rooms never call Gemini directly.

Apply `server/database/migrations/007_create_kanji_lessons.sql` and `server/database/migrations/008_add_kanji_romaji.sql`, then configure the server variables shown in the Genki section above. Generate and persist the complete deck from the repository root:

```bash
npm run generate:kanji
npm run generate:kanji -- --dry-run
```

The generator validates that Gemini returned a complete, grouped N5 deck with 50-150 unique Han characters before replacing the published N5 deck. Each example may use the current character only, so examples cannot silently teach unintroduced Kanji. Gemini chooses the appropriate character count and number of themes; the bounds only prevent malformed or impractically large responses. `--dry-run` prints the validated deck without writing to Supabase. Do not run the normal command until both migrations have been applied and the server has valid `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` values.

## Genki Grammar Content

Grammar lesson content is generated once by a server-side CLI and stored in Supabase. Gemini is never called directly by the browser, and normal lesson API requests read persisted records only.

Apply `server/database/migrations/006_create_grammar_lessons.sql`, then configure these server variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
```

Run the generator from the repository root:

```bash
npm run generate:genki-lessons
npm run generate:genki-lessons -- --dry-run
npm run generate:genki-lessons -- --lesson 5
npm run generate:genki-lessons -- --lesson 5 --force
```

The generator processes lessons sequentially and persists each successful lesson immediately. It skips existing lessons by default, so interrupted runs can resume without regenerating completed lessons. `--dry-run` validates and prints content without writing to Supabase. Invalid Gemini JSON, out-of-scope content, provider failures, and database failures stop the process with a non-zero exit code.

Generated records should be reviewed before production release. When content is corrected, increment the content version and rerun the relevant lesson with `--force`.

### Server on Render

Configure a Render web service with:

- Root directory: `server`
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/health`
- `CLIENT_ORIGINS`: comma-separated allowed client origins
- `REDIS_URL`: Redis connection URL for shared Socket.io rooms

The server build command runs `tsc --noEmit` to type-check the TypeScript backend without producing build artifacts. The server runs through `tsx`, which executes the ESM TypeScript sources directly.

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

Sentence records are stored in `server/data/kana-sentences.ts`.

The current dataset is generated from independent beginner vocabulary dimensions:

- 20 subjects
- 15 everyday places
- 20 activities
- 6,000 unique sentence combinations

`server/services/card-service.ts` selects random records without duplicates within a deck. New rooms and the card-generation endpoint each receive a random set of 10 prompts.

## Romaji and Scoring

- Answers are case-insensitive.
- Whitespace is ignored during normalization.
- `wo` is normalized to `o`.
- Romaji is tokenized using `client/src/utils/romaji.ts`.
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
- `GET /api/pvp-record` - Returns the authenticated player's aggregated multiplayer 1v1 record (`totalMatches`, `wins`, `losses`, `ties`, `winRate`) computed by pairing their `assessment_results` rows (those with a `companion_user_id`) against the opponent's counterpart rows, which RLS hides from the client.
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
npm run typecheck
npm test
```

Server:

```bash
npm run dev
npm run build
npm run generate:kanji
npm start
```

Client:

```bash
npm run dev
npm run build
npm run preview
```

## Customization

- Add vocabulary dimensions or sentence templates in `server/data/kana-sentences.ts`.
- Generate and review Kanji study records with `npm run generate:kanji`.
- Adjust random deck selection in `server/services/card-service.ts`.
- Adjust scoring and difference behavior in `client/src/utils/romaji.ts`.
- Update the logo in `client/src/assets/logo.svg`.
- Customize the visual theme in the CSS files under `client/src/`.
