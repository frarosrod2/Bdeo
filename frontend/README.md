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

## Project Structure

```
bdeo/
├── backend/          # Node.js REST API
│   ├── src/
|   |   ├── openapi.yaml          # Contract
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
├── frontend/         # Angular application
│   └── src/
│       ├── app/
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

## 2 — Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

The `.env` file should contain:

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

## 3 — Running Tests

### Unit and integration tests

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
Current coverage: **100% Statements · 100% Branches · 100% Functions · 100% Lines**.

---

## 4 — Frontend Setup

```bash
cd frontend
npm install
```

### Run in development mode

```bash
npm start
```

The application will be available at `http://localhost:4200`.

> The frontend expects the API to be running at `http://localhost:3000/api`.

### Build for production

```bash
npm run build
```

Artifacts are generated in `frontend/dist/`.

---

## API Summary

The full contract is defined in [`openapi.yaml`](./openapi.yaml).

| Method | Endpoint                                 | Description                                    |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| GET    | `/api/claims`                            | List all claims                                |
| POST   | `/api/claims`                            | Create a claim                                 |
| GET    | `/api/claims/:claimId`                   | Get claim detail with damages                  |
| PATCH  | `/api/claims/:claimId`                   | Update title or description                    |
| PATCH  | `/api/claims/:claimId/status`            | Change claim status                            |
| DELETE | `/api/claims/:claimId`                   | Delete a claim                                 |
| GET    | `/api/claims/:claimId/damages`           | List damages for a claim                       |
| POST   | `/api/claims/:claimId/damages`           | Add a damage (claim must be in Pending status) |
| GET    | `/api/claims/:claimId/damages/:damageId` | Get a specific damage                          |
| PATCH  | `/api/claims/:claimId/damages/:damageId` | Update a damage                                |
| DELETE | `/api/claims/:claimId/damages/:damageId` | Delete a damage                                |

### Status Transition Rules

```
Pending ──► InReview ──► Finished
InReview ──► Pending   (rollback allowed)
Finished ──► (terminal state, no further transitions)
```

Additional rule: the transition to **Finished** is blocked when the claim has at least one damage with `high` severity and the description is 100 characters or fewer.

---

## Architecture Decisions

### Repository Pattern + Dependency Injection

Controllers depend on services; services depend on repository interfaces (`IClaimRepository`, `IDamageRepository`). Concrete implementations are injected at application startup from `app.ts`. This simplifies unit testing: each layer is tested with in-memory mock repositories, without accessing MongoDB.

### Design Pattern: Strategy (state transitions)

Allowed state transitions are encoded as an `ALLOWED_TRANSITIONS` map (a Strategy map) inside `ClaimService`. Adding or modifying a transition only requires editing that data structure, without affecting any other logic.

### Zod for Input Validation

All incoming payloads are validated against Zod schemas before reaching the controllers. A generic `validate` middleware wraps the `zod.parse()` call and converts errors into structured 400 responses.

### `totalAmount` Recalculation

`totalAmount` is stored in the `Claim` document and recalculated on the server on every damage create, update, or delete operation, ensuring the database is always the single source of truth. The Angular frontend reflects this value reactively from the API response returned after each mutation.
