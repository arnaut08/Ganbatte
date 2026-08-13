## 1. Project Overview & Tech Stack
- **Architecture**: Separated Client/Server (Client: React + Vite, Server: Node.js + Express).
- **Module System**: ES Modules (`"type": "module"` in `package.json`). ALWAYS use `import`/`export`. Never use CommonJS (`require` / `module.exports`).
- **Target Standard**: ECMAScript 2024+ (Native `async/await`, destructuring, optional chaining `?.`, nullish coalescing `??`).

---

## 2. Directory & File Structure Best Practices

When generating new features, pages, or API endpoints, strictly adhere to this modular layout:

### Backend Structure (`/server`)

server/
├── config/             # Environment variables parser & app configurations
├── controllers/        # Express route handlers (keep lean, delegate logic)
├── middleware/         # Security, validation, auth, and error handling
├── routes/             # Express route definitions mapping paths to controllers
├── services/           # Core business logic & third-party API handlers
├── utils/              # Helper functions & custom error classes
└── app.js              # Express application setup & middleware stack

### Frontend Structure (`/client`)

client/
├── src/
│   ├── assets/         # Static assets (images, SVGs, global styles)
│   ├── components/     # Reusable components
│   │   ├── common/     # Generic UI elements (Button, Input, Modal)
│   │   └── layout/     # Structural components (Navbar, Sidebar, Footer)
│   ├── features/       # Feature-driven domain modules (auth, dashboard, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Top-level view pages mapped to client routes
│   ├── services/       # API integration layer (Axios or fetch wrappers)
│   ├── utils/          # Helper utilities, constants, data formatters
│   ├── App.jsx         # Root component & routing initialization
│   └── main.jsx        # Vite entry point

---

## 3. Naming Conventions

- **React Components & Pages**: `PascalCase` (e.g., `UserProfile.jsx`, `NavigationBar.jsx`).
- **Backend & Utility Files**: `kebab-case` (e.g., `auth-controller.js`, `rate-limiter.js`).
- **Functions & Variables**: `camelCase` (e.g., `getUserProfile`, `isSubmitting`).
- **Global Constants & Env Variables**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`, `PORT`).
- **React Custom Hooks**: `camelCase` starting with `use` (e.g., `useAuth.js`).
- **API Endpoints**: Lowercase `kebab-case` with plural nouns (e.g., `/api/v1/user-profiles`).

---

## 4. ECMAScript & Development Rules

### Backend (Node.js + Express)
- Use top-level `import`/`export` everywhere.
- Prefer `const` by default; use `let` only when variable reassignment is required. **Never use `var`**.
- Wrap all asynchronous controller functions in an `async` error-handling wrapper or `try/catch` block, passing errors to `next(err)` for centralized processing.
- Maintain thin controllers: delegate complex computations or external calls to the `/services` directory.

### Frontend (React + Vite)
- Functional Components with Hooks ONLY. Do not write class components.
- Single Responsibility Principle: Keep components UI-focused. Extract complex state or side-effects into custom hooks (`/hooks`) or service modules (`/services`).
- Controlled components for all form management.

---

## 5. Security Principles (Strictly Enforced)

### Express Backend Security
1. **HTTP Security Headers**: Always initialize `helmet()` at the very top of the middleware chain.
2. **Strict CORS Setup**: Limit origins exclusively to trusted client endpoints (e.g., `http://localhost:5173` or environment variables). Avoid wildcard `*` settings.
3. **Rate Limiting & Payload Guards**:
   - Implement `express-rate-limit` on public routes and auth endpoints to mitigate brute-force and DDoS attacks.
   - Enforce explicit payload size caps: `express.json({ limit: '10kb' })`.
4. **Input Sanitization & Validation**:
   - Never trust input from `req.body`, `req.query`, or `req.params`. Validate incoming schema using a validator library (e.g., `zod` or `joi`) in middleware prior to controller execution.
5. **Error Masking & Stack Protection**:
   - Never expose internal database traces, stack logs, or raw system error objects to client API responses.
   - Return generic error signatures (`{ "error": "Internal Server Error" }`) to the client while logging detailed errors server-side.
6. **HTTP Parameter Pollution**: Apply `hpp` middleware to avoid array/parameter pollution attacks.

### React + Vite Security
1. **Secrets Leakage**:
   - Frontend variables must carry the `VITE_` prefix (e.g., `VITE_API_BASE_URL`).
   - **NEVER** place server secrets, private API keys, or service tokens into Vite environment files.
2. **Cross-Site Scripting (XSS)**:
   - Avoid `dangerouslySetInnerHTML`. If mandatory, sanitize input string using `DOMPurify`.
   - Never evaluate strings as executable code via `eval()` or `new Function()`.
3. **Client-Side Storage**:
   - Do not store sensitive auth credentials or access tokens in `localStorage` or `sessionStorage`. Rely on HTTP-only, `SameSite=Strict`, `Secure` cookies managed by the Express backend.