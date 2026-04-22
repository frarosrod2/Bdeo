# Claims Management System — Bdeo Technical Case

Monorepo for the Bdeo Full Stack Developer technical exercise.

## Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Backend  | Node.js · TypeScript · Express · Zod |
| Database | MongoDB (Mongoose)                   |
| Testing  | Vitest · @vitest/coverage-v8         |
| Frontend | Angular (reactive forms, standalone) |

---

## Project structure

```
bdeo/
├── backend/          # Node.js REST API
│   ├── src/
│   │   ├── common/errors/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/     # Zod validation schemas
│   │   └── services/
│   └── test/
│       ├── integration/ # totalAmount integrity tests
│       └── unit/
├── openapi.yaml          # OpenAPI 3.0 contract (SDD)
├── AI_LOG.md
└── README.md
```

---

## Prerequisites

- Node.js ≥ 20
- Docker (for MongoDB) **or** a running MongoDB instance

---

## 1 — Start MongoDB

```bash
docker run -d --name mongo-bdeo -p 27017:27017 mongo:latest
```

---

## 2 — Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

`.env` must contain:

```env
MONGO_URI=mongodb://localhost:27017/bdeo
PORT=3000
```

### Run in development mode

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`.

### Build for production

```bash
npm run build
npm start
```

---

## 3 — Run tests

### Unit + integration tests

```bash
cd backend
npm test
```

### Coverage report

```bash
cd backend
npm run test:coverage
```

The HTML report is generated at `backend/coverage/index.html`.  
Current coverage: **100 % Statements · 100 % Branches · 100 % Functions · 100 % Lines**.

---

## API overview

The full contract is defined in [`openapi.yaml`](./openapi.yaml).

| Method | Endpoint                                 | Description                          |
| ------ | ---------------------------------------- | ------------------------------------ |
| GET    | `/api/claims`                            | List all claims                      |
| POST   | `/api/claims`                            | Create a claim                       |
| GET    | `/api/claims/:claimId`                   | Get claim detail with damages        |
| PATCH  | `/api/claims/:claimId`                   | Update title / description           |
| PATCH  | `/api/claims/:claimId/status`            | Transition claim status              |
| DELETE | `/api/claims/:claimId`                   | Delete a claim                       |
| GET    | `/api/claims/:claimId/damages`           | List damages for a claim             |
| POST   | `/api/claims/:claimId/damages`           | Add a damage (claim must be Pending) |
| GET    | `/api/claims/:claimId/damages/:damageId` | Get single damage                    |
| PATCH  | `/api/claims/:claimId/damages/:damageId` | Update a damage                      |
| DELETE | `/api/claims/:claimId/damages/:damageId` | Delete a damage                      |

### Status transition rules

```
Pending ──► In Review ──► Finished
In Review ──► Pending   (rollback allowed)
Finished ──► (terminal, no further transitions)
```

Additional rule: transitioning to **Finished** is blocked when the claim has at least one `high`-severity damage and the description is ≤ 100 characters.

---

## Architecture decisions

### Repository pattern + Dependency Injection

Controllers depend on services; services depend on repository interfaces (`IClaimRepository`, `IDamageRepository`). Concrete implementations are injected at startup in `app.ts`. This makes unit tests trivial — every layer is tested with in-memory mock repositories, without touching MongoDB.

### Design pattern: Strategy (status transitions)

The allowed status transitions are encoded as a `ALLOWED_TRANSITIONS` record (a Strategy map) inside `ClaimService`. Adding or changing a transition requires editing a single data structure, with zero impact on surrounding logic.

### Zod for input validation

All incoming payloads are validated against Zod schemas before reaching controllers. A generic `validate` middleware wraps the Zod parse call and converts errors into structured 400 responses.

### `totalAmount` recalculation

`totalAmount` is stored on the `Claim` document and recalculated server-side on every damage create / update / delete, ensuring the database is always the single source of truth. The Angular frontend reflects this value reactively via the value returned by the API after each mutation.

