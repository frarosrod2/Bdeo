# Claims Management System — Caso Técnico Bdeo

Monorepo para el ejercicio técnico de desarrollador Full Stack de Bdeo.

## Stack

| Capa       | Tecnología                                |
| ---------- | ----------------------------------------- |
| Backend    | Node.js · TypeScript · Express · Zod      |
| Base de datos | MongoDB (Mongoose)                     |
| Testing    | Vitest · @vitest/coverage-v8              |
| Frontend   | Angular (formularios reactivos, standalone) |

---

## Estructura del proyecto

```
bdeo/
├── backend/          # API REST en Node.js
│   ├── src/
|   |   ├── openapi.yaml          # Contrato 
│   │   ├── common/errors/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/     # Esquemas de validación Zod
│   │   └── services/
│   └── test/
│       ├── integration/ # Tests de integridad de totalAmount
│       └── unit/
├── frontend/         # Aplicación Angular
│   └── src/
│       ├── app/
├── AI_LOG.md
└── README.md
```

---

## Requisitos previos

- Node.js ≥ 20
- Docker (para MongoDB) **o** una instancia de MongoDB en ejecución

---

## 1 — Iniciar MongoDB

```bash
docker run -d --name mongo-bdeo -p 27017:27017 mongo:latest
```

---

## 2 — Configuración del backend

```bash
cd backend
cp .env.example .env
npm install
```

El archivo `.env` debe contener:

```env
MONGO_URI=mongodb://localhost:27017/bdeo
PORT=3000
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000/api`.

### Compilar para producción

```bash
npm run build
npm start
```

---

## 3 — Ejecutar los tests
 
### Tests unitarios e de integración
 
```bash
cd backend
npm test
```
 
### Informe de cobertura
 
```bash
cd backend
npm run test:coverage
```
 
El informe HTML se genera en `backend/coverage/index.html`.  
Cobertura actual: **100 % Sentencias · 100 % Ramas · 100 % Funciones · 100 % Líneas**.
 
 
---
 
## 4 — Configuración del frontend
 
```bash
cd frontend
npm install
```
 
### Ejecutar en modo desarrollo
 
```bash
npm start
```
 
La aplicación estará disponible en `http://localhost:4200`.
 
> El frontend espera que la API esté corriendo en `http://localhost:3000/api`.
 
### Compilar para producción
 
```bash
npm run build
```
 
Los artefactos se generan en `frontend/dist/`.
 
---
 
## Resumen de la API
 
El contrato completo está definido en [`openapi.yaml`](./openapi.yaml).
 
| Método | Endpoint                                 | Descripción                                   |
| ------ | ---------------------------------------- | --------------------------------------------- |
| GET    | `/api/claims`                            | Listar todos los siniestros                   |
| POST   | `/api/claims`                            | Crear un siniestro                            |
| GET    | `/api/claims/:claimId`                   | Obtener el detalle de un siniestro con daños  |
| PATCH  | `/api/claims/:claimId`                   | Actualizar título o descripción               |
| PATCH  | `/api/claims/:claimId/status`            | Cambiar el estado del siniestro               |
| DELETE | `/api/claims/:claimId`                   | Eliminar un siniestro                         |
| GET    | `/api/claims/:claimId/damages`           | Listar los daños de un siniestro              |
| POST   | `/api/claims/:claimId/damages`           | Añadir un daño (el siniestro debe estar en Pending) |
| GET    | `/api/claims/:claimId/damages/:damageId` | Obtener un daño concreto                      |
| PATCH  | `/api/claims/:claimId/damages/:damageId` | Actualizar un daño                            |
| DELETE | `/api/claims/:claimId/damages/:damageId` | Eliminar un daño                              |
 
### Reglas de transición de estado
 
```
Pending ──► InReview ──► Finished
InReview ──► Pending   (reversión permitida)
Finished ──► (estado terminal, sin más transiciones)
```
 
Regla adicional: la transición a **Finished** queda bloqueada cuando el siniestro tiene al menos un daño de severidad `high` y la descripción tiene 100 caracteres o menos.
 
---
 
## Decisiones de arquitectura
 
### Patrón Repository + Inyección de dependencias
 
Los controladores dependen de los servicios; los servicios dependen de interfaces de repositorio (`IClaimRepository`, `IDamageRepository`). Las implementaciones concretas se inyectan en el arranque de la aplicación desde `app.ts`. Esto simplifica los tests unitarios: cada capa se prueba con repositorios mock en memoria, sin acceder a MongoDB.
 
### Patrón de diseño: Strategy (transiciones de estado)
 
Las transiciones de estado permitidas se codifican como un mapa `ALLOWED_TRANSITIONS` (un Strategy map) dentro de `ClaimService`. Añadir o modificar una transición requiere editar únicamente esa estructura de datos, sin afectar al resto de la lógica.
 
### Zod para validación de entrada
 
Todos los payloads entrantes se validan contra esquemas Zod antes de llegar a los controladores. Un middleware genérico `validate` envuelve la llamada a `zod.parse()` y convierte los errores en respuestas 400 estructuradas.
 
### Recálculo de `totalAmount`
 
`totalAmount` se almacena en el documento `Claim` y se recalcula en el servidor en cada operación de creación, actualización o eliminación de un daño, garantizando que la base de datos sea siempre la única fuente de verdad. El frontend en Angular refleja este valor de forma reactiva a partir de la respuesta que devuelve la API tras cada mutación.