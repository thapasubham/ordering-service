# Coffee Ordering Microservices

A microservices-based coffee ordering system built with Node.js (TypeScript), Go (API Gateway), RabbitMQ, and MongoDB. Services communicate over HTTP through the gateway and asynchronously via RabbitMQ. Order and payment routes on the gateway require a JWT validated by the user-auth service.

## Architecture

```
                    ┌──────────────────┐
                    │   API Gateway    │  Go — default :8080
                    │  (JWT on /order, │
                    │   /payment)      │
                    └────────┬─────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ Order        │    │ Payment      │      │ User Auth    │
│ :3001        │    │ :3002        │      │ :3003        │
└──────┬───────┘    └──────┬───────┘      └──────┬───────┘
       │                   │                    │
       │    MongoDB        │    MongoDB         │  MongoDB
       └───────────────────┴────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    RabbitMQ     │
                    │     :5672       │
                    └─────────────────┘
```

### Services

1. **API Gateway** (`gateway`)
   - Entry point for client traffic (default **port 8080**).
   - `GET /` — simple greeting.
   - `GET /health` — aggregates health from order, payment, and user-auth.
   - `/order/...` and `/payment/...` — reverse-proxied to the Node services with **Bearer JWT** verification via user-auth (`GET {USER_AUTH_URL}/api/verify`).
   - `/auth/...` — proxied to user-auth **without** JWT middleware (used for login/register).

2. **Order Service** (`order_service`, port **3001**)
   - Order API; persists orders in MongoDB (database `order`, collection `order` — see `order_service/src/client/mongoDB.client.ts`).
   - Publishes to queue `pay.order` when payment is requested.
   - Consumes `payment.success` and `payment.failed` to update order status.

3. **Payment Service** (`payment_service`, port **3002**)
   - Consumes `pay.order`, processes payment, publishes `payment.success` or `payment.failed`.
   - Persists payment records in MongoDB (configurable DB/collection via env).

4. **User Auth Service** (`user-auth`, port **3003**)
   - `POST /api/register`, `POST /api/login`, `GET /api/verify` (used by the gateway).
   - MongoDB for users; JWT signing via `JWT_SECRET`.

### Message flow (RabbitMQ)

- **Request payment:** Order service publishes to `pay.order` → Payment service consumes.
- **Outcome:** Payment service publishes to `payment.success` or `payment.failed` → Order service consumes and updates status.

Queues use durable configuration with companion dead-letter queues (see `order_service/src/rabbitmq/registerqueue.ts` and payment publisher setup).

**Gateway path mapping:** `/order/` is stripped and forwarded to the order service root (e.g. gateway `GET /order/health` → order service `GET /health`). Same pattern for `/payment/` and `/auth/`.

## Tech stack

- **Runtime:** Node.js, Go
- **Languages:** TypeScript, Go
- **HTTP:** Express.js (services), `net/http` + reverse proxy (gateway)
- **Messaging:** RabbitMQ (amqplib)
- **Data:** MongoDB (official driver)
- **Infra:** Docker Compose (example file for RabbitMQ + MongoDB)

## Prerequisites

- Node.js 18+
- Go 1.25+ (see `gateway/go.mod`)
- Docker and Docker Compose (for local RabbitMQ/MongoDB)

## Getting started

### 1. Clone and enter the repo

```bash
git clone <your-repository-url>
cd coffee_ordering
```

### 2. Start infrastructure

```bash
cp docker-compose.example.yaml docker-compose.yaml
docker compose up -d
```

From the example compose file you get:

- **RabbitMQ** — AMQP `localhost:5672`, management UI `http://localhost:15672` (default user/pass in the example file — change for anything beyond local dev).
- **MongoDB** — host port **`27020`** → container `27017` (root user/password in compose).
- **mongo-express** — `http://localhost:8081` (optional DB UI).

There is **no** Redis service in this project; persistence is MongoDB.

### 3. Install dependencies

**Node services (order, payment, user-auth):**

```bash
cd order_service && npm install && cd ..
cd payment_service && npm install && cd ..
cd user-auth && npm install && cd ..
```

**Gateway:**

```bash
cd gateway && go mod download && cd ..
```

### 4. Environment variables

**Gateway** — optional `.env` in `gateway/` (loaded by `godotenv`). Defaults in `gateway/config/config.go`:

| Variable        | Description              | Default                 |
| --------------- | ------------------------ | ----------------------- |
| `ORDER_URL`     | Order service base URL   | `http://localhost:3001` |
| `PAYMENT_URL`   | Payment service base URL | `http://localhost:3002` |
| `USER_AUTH_URL` | User-auth base URL       | `http://localhost:3003` |

**Order service** (`order_service/.env`):

| Variable       | Description                                                            |
| -------------- | ---------------------------------------------------------------------- |
| `RABBITMQ_URL` | AMQP URL                                                               |
| `MONGODB_URL`  | MongoDB connection string                                              |
| `PORT`         | HTTP port (default `3001`)                                             |
| `NODE_ENV`     | e.g. `development`                                                     |
| `API_GATEWAY`  | CORS allowed origin — set to gateway URL, e.g. `http://localhost:8080` |

**Payment service** (`payment_service/.env`):

| Variable             | Description                         |
| -------------------- | ----------------------------------- |
| `RABBITMQ_URL`       | AMQP URL                            |
| `MONGODB_URL`        | MongoDB connection string           |
| `MONGODB_DB`         | Database name                       |
| `MONGODB_COLLECTION` | Collection name                     |
| `PORT`               | HTTP port (default `3002`)          |
| `API_GATEWAY`        | CORS — e.g. `http://localhost:8080` |

**User-auth** (`user-auth/.env` — see `user-auth/.env.example`):

| Variable      | Description                |
| ------------- | -------------------------- |
| `PORT`        | HTTP port (default `3003`) |
| `MONGODB_URL` | MongoDB connection string  |
| `JWT_SECRET`  | Secret for signing JWTs    |

**CORS note:** Order and payment default `API_GATEWAY` in code to `http://localhost:3067` if unset, while the Go gateway listens on **8080**. For local runs, set `API_GATEWAY` on both services to `http://localhost:8080` so browser CORS matches the gateway.

Example Mongo URL when using the example compose (host port 27020):

`mongodb://root:example@localhost:27020`

### 5. Run services

Use four terminals (or your process manager of choice):

```bash
# Terminal 1 — gateway (:8080)
cd gateway && go run .

# Terminal 2 — order (:3001)
cd order_service && npm run dev

# Terminal 3 — payment (:3002)
cd payment_service && npm run dev

# Terminal 4 — user-auth (:3003)
cd user-auth && npm run dev
```

**URLs**

- API Gateway: `http://localhost:8080`
- Order (direct): `http://localhost:3001`
- Payment (direct): `http://localhost:3002`
- User-auth (direct): `http://localhost:3003`

## API usage (via gateway)

Authenticated routes need: `Authorization: Bearer <access_token>` from `POST /auth/api/login` (after `POST /auth/api/register`).

### Gateway health

`GET http://localhost:8080/health`

### Order (prefix `/order/`)

| Method | Path (via gateway)         | Auth |
| ------ | -------------------------- | ---- |
| GET    | `/order/health`            | Yes  |
| GET    | `/order/api/order`         | Yes  |
| POST   | `/order/api/order`         | Yes  |
| PUT    | `/order/api/order/pay/:id` | Yes  |

### Payment (prefix `/payment/`)

| Method | Path (via gateway)                    | Auth |
| ------ | ------------------------------------- | ---- |
| GET    | `/payment/health`                     | Yes  |
| POST   | `/payment/api/payment`                | Yes  |
| GET    | `/payment/api/payment`                | Yes  |
| GET    | `/payment/api/payment/:id`            | Yes  |
| GET    | `/payment/api/payment/order/:orderId` | Yes  |

### Auth (prefix `/auth/` — no gateway JWT)

| Method | Path (via gateway)   |
| ------ | -------------------- |
| GET    | `/auth/health`       |
| POST   | `/auth/api/register` |
| POST   | `/auth/api/login`    |
| GET    | `/auth/api/verify`   |

## Project structure

```
coffee_ordering/
├── docker-compose.example.yaml   # RabbitMQ + MongoDB (+ mongo-express)
├── gateway/
│   ├── cmd/
│   ├── config/
│   └── main.go
├── order_service/
├── payment_service/
├── user-auth/
├── eslint.config.mts
└── README.md
```

## Features (as implemented)

- API Gateway with path-based routing and JWT gate on order/payment paths
- Async payment flow over RabbitMQ (`pay.order`, `payment.success`, `payment.failed`)
- DLQ-style queue configuration for selected queues
- Typed Node services (TypeScript) and typed Go gateway
- Health endpoints per service plus aggregated gateway health
- Graceful shutdown hooks where implemented (gateway, Node services)

## Linting (repository root)

```bash
npm install
npm run lint
```

## Example curl (through gateway)

Replace `TOKEN` with a JWT from login.

```bash
# Register
curl -s -X POST http://localhost:8080/auth/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"secret","name":"Ada"}'

# Login — use returned token
curl -s -X POST http://localhost:8080/auth/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"secret"}'

# Create order (authenticated)
curl -s -X POST http://localhost:8080/order/api/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Latte","price":5.00}'

# List orders
curl -s http://localhost:8080/order/api/order \
  -H "Authorization: Bearer TOKEN"

# Request payment for an order id
curl -s -X PUT http://localhost:8080/order/api/order/pay/ORDER_ID \
  -H "Authorization: Bearer TOKEN"

# Gateway health (no JWT)
curl -s http://localhost:8080/health
```

## Troubleshooting

### RabbitMQ connection failed

- `docker compose ps` and check logs for the RabbitMQ container.
- Ensure `RABBITMQ_URL` in each Node service matches compose credentials and host (`localhost` when services run on the host).

### MongoDB connection failed

- Default example mapping: **`localhost:27020`** on the host.
- Use a connection string that includes auth if your compose defines `MONGO_INITDB_ROOT_USERNAME` / `PASSWORD`.

### 401 / 503 on `/order` or `/payment`

- 401: missing/invalid `Authorization: Bearer ...`.
- 503: gateway cannot reach user-auth verify endpoint — ensure user-auth is running and `USER_AUTH_URL` is correct.

### CORS errors from a browser

- Set `API_GATEWAY` on order and payment to the exact gateway origin (e.g. `http://localhost:8080`).

## Security note

Change default RabbitMQ, MongoDB, and JWT secrets for any shared or production-like environment. Do not commit real `.env` files.
