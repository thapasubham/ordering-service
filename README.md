# Coffee Ordering Microservices

A microservices-based coffee ordering system built with Node.js, TypeScript, Express, RabbitMQ, and Redis. The system consists of multiple independent services that communicate via message queues.

## Architecture

This is a **true microservices architecture** with multiple independent services:

```
┌──────────────────┐         ┌──────────────────┐
│  Order Service   │         │ Payment Service  │
│   Port: 3001     │         │   Port: 3002     │
└────────┬─────────┘         └────────┬─────────┘
         │                              │
         │  (publishes events)         │  (publishes events)
         │                              │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼──────────┐
         │      RabbitMQ       │  Message Queue
         │   Port: 5672        │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │       Redis         │  Shared Data Store
         │   Port: 6379        │
         └─────────────────────┘
```

### Services

1. **API Gateway** (`gateway`)
   - Entry point for all client requests
   - Routes requests to Order and Payment services
   - Handles path prefix stripping
   - Logs requests via custom middleware
   - Port: `3067`

2. **Order Service** (`order_service`)
   - Creates and manages orders
   - Publishes payment requests
   - Consumes payment status updates
   - Port: `3001`

3. **Payment Service** (`payment_service`)
   - Processes payment requests
   - Publishes payment success/failure events
   - Manages payment records
   - Port: `3002`

### Message Flow

```
Order Creation:
POST /order/api/order → API Gateway → Order Service → RabbitMQ (create.order) → Order Service (saves to Redis)

Payment Request:
PUT /order/api/order/pay/:id → API Gateway → Order Service → RabbitMQ (pay.order) → Payment Service

Payment Processing:
Payment Service → Processes payment → RabbitMQ (payment.success/failed) → Order Service (updates order status)
```

## Tech Stack

- **Runtime**: Node.js, Go (Gateway)
- **Language**: TypeScript, Go
- **Framework**: Express.js
- **Message Queue**: RabbitMQ
- **Database**: Redis
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js (v18 or higher)
- Go (v1.25 or higher)
- Docker & Docker Compose
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd coffee_ordering
```

### 2. Start Infrastructure Services

**Option 1: Use existing docker-compose.yaml**

```bash
docker-compose up -d
```

**Option 2: Use example file (recommended for first-time setup)**

```bash
# Copy the example file
cp docker-compose.example.yaml docker-compose.yaml

# Review and modify docker-compose.yaml if needed, then start
docker-compose up -d
```

This will start:

- **RabbitMQ** on `localhost:5672` (Management UI: `http://localhost:15672`)
- **Redis** on `localhost:6379` (RedisInsight: `http://localhost:8001`)

> **Security Note:** Change default credentials in production environments!

### 3. Install Dependencies & Build

**Node Services:**

```bash
# Order Service
cd order_service
npm install
cd ..

# Payment Service
cd payment_service
npm install
cd ..
```

**API Gateway:**

```bash
cd gateway
go mod download
```

### 4. Configure Environment Variables

Create `.env` files for Node services:

**Order Service** (`order_service/.env`):

```env
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=coolPasscode
REDIS_USERNAME=default
PORT=3001
NODE_ENV=development
```

**Payment Service** (`payment_service/.env`):

```env
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=coolPasscode
REDIS_USERNAME=default
PORT=3002
NODE_ENV=development
```

### 5. Run the Services

Terminal 1 - API Gateway:

```bash
cd gateway
go run main.go
```

Terminal 2 - Order Service:

```bash
cd order_service
npm run dev
```

Terminal 3 - Payment Service:

```bash
cd payment_service
npm run dev
```

Services will run on:

- API Gateway: `http://localhost:3067`
- Order Service: `http://localhost:3001`
- Payment Service: `http://localhost:3002`

## API Endpoints

All requests should be routed through the API Gateway on port `3067`.

### Order Service (Prefix: `/order/`)

#### Health Check

`GET /order/health`

#### Get All Orders

`GET /order/api/order`

#### Create Order

`POST /order/api/order`

**Request Body:**

```json
{
  "name": "Cappuccino",
  "price": 4.5
}
```

#### Request Payment

`PUT /order/api/order/pay/:id`

### Payment Service (Prefix: `/payment/`)

#### Health Check

`GET /payment/health`

#### Process Payment

```http
POST /api/payment
Content-Type: application/json
```

**Request Body:**

```json
{
  "orderId": "order_123",
  "amount": 4.5,
  "paymentMethod": "credit_card"
}
```

**Response:** `201 Created`

```json
{
  "id": "payment_id",
  "orderId": "order_123",
  "amount": 4.5,
  "status": "success",
  "createdAt": "2024-01-01T10:05:00.000Z"
}
```

#### Get Payment

```http
GET /api/payment/:id
```

#### Get All Payments

```http
GET /api/payment
```

#### Get Payments by Order ID

```http
GET /api/payment/order/:orderId
```

## Message Queue Flow

### Order Creation Flow

```
1. POST /api/order → Order Service
   ↓
2. Order Service publishes to 'create.order' queue
   ↓
3. Order Service consumer receives message
   ↓
4. Order saved to Redis with 'pending' status
```

### Payment Processing Flow

```
1. PUT /api/order/pay/:id → Order Service
   ↓
2. Order Service publishes to 'pay.order' queue
   ↓
3. Payment Service consumer receives payment request
   ↓
4. Payment Service processes payment
   ↓
5. Payment Service publishes 'payment.success' or 'payment.failed'
   ↓
6. Order Service consumer receives payment result
   ↓
7. Order Service updates order status in Redis
```

### RabbitMQ Queues

- `create.order` - Order creation events (Order Service → Order Service)
- `pay.order` - Payment requests (Order Service → Payment Service)
- `payment.success` - Successful payment events (Payment Service → Order Service)
- `payment.failed` - Failed payment events (Payment Service → Order Service)

## Project Structure

```
coffee_ordering/
├── docker-compose.yaml          # Infrastructure services
├── gateway/                     # API Gateway (Go)
│   ├── cmd/                     # Proxy and logging logic
│   ├── main.go                  # Entry point
│   └── go.mod
├── order_service/               # Order microservice (Node.js)
│   ├── src/
│   │   ├── client/              # Infrastructure clients
│   │   ├── controller/          # Request handlers
│   │   ├── rabbitmq/            # Message queue logic
│   │   ├── repository/          # Data access layer
│   │   ├── route/               # Route definitions
│   │   ├── service/             # Business logic
│   │   └── index.ts             # Entry point
│   └── package.json
├── payment_service/             # Payment microservice (Node.js)
│   ├── src/
│   │   ├── client/              # Infrastructure clients
│   │   ├── controller/          # Request handlers
│   │   ├── rabbitmq/            # Message queue logic
│   │   ├── repository/          # Data access layer
│   │   ├── route/               # Route definitions
│   │   ├── service/             # Business logic
│   │   └── index.ts             # Entry point
│   └── package.json
└── README.md
```

## Features

- **Asynchronous Processing**: Orders processed via RabbitMQ message queue
- **Dead Letter Queue (DLQ)**: Failed messages routed to DLQ for manual inspection
- **Error Handling**: Global error handler with consistent error responses
- **Input Validation**: Request validation before processing
- **Message Persistence**: Messages survive broker restarts
- **Graceful Shutdown**: Proper cleanup on application termination
- **Health Checks**: Service health monitoring endpoint
- **Type Safety**: Full TypeScript implementation

## Configuration

### Environment Variables (Node Services)

| Variable         | Description             | Default                                |
| ---------------- | ----------------------- | -------------------------------------- |
| `RABBITMQ_URL`   | RabbitMQ connection URL | `amqp://admin:admin123@localhost:5672` |
| `REDIS_HOST`     | Redis host              | `localhost`                            |
| `REDIS_PORT`     | Redis port              | `6379`                                 |
| `REDIS_PASSWORD` | Redis password          | `coolPasscode`                         |
| `REDIS_USERNAME` | Redis username          | `default`                              |
| `PORT`           | Application port        | `3001` (Order), `3002` (Payment)       |
| `NODE_ENV`       | Environment mode        | `development`                          |

## Error Handling

The application uses a global error handler that provides consistent error responses:

```json
{
  "error": "Bad request",
  "message": "Missing required fields: price and name"
}
```

**Error Status Codes:**

- `400` - Bad Request (validation errors)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and start production server
- `npm run lint` - Run ESLint (from root directory)

## Monitoring

### RabbitMQ Management UI

Access at `http://localhost:15672`

- Monitor queues and messages
- View message rates and consumers
- Inspect Dead Letter Queues

### RedisInsight

Access at `http://localhost:8067`

- View stored orders
- Monitor Redis performance
- Execute Redis commands

## Testing

Example API calls using cURL (through Gateway):

```bash
# Order Service - Create an order
curl -X POST http://localhost:3067/order/api/order \
  -H "Content-Type: application/json" \
  -d '{"name": "Latte", "price": 5.00}'

# Order Service - Get all orders
curl http://localhost:3067/order/api/order

# Order Service - Request payment for an order
curl -X PUT http://localhost:3067/order/api/order/pay/{order_id}

# Payment Service - Process payment
curl -X POST http://localhost:3067/payment/api/payment \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_123", "amount": 5.00, "paymentMethod": "credit_card"}'

# Health checks
curl http://localhost:3067/order/health
curl http://localhost:3067/payment/health
```

## Troubleshooting

### RabbitMQ Connection Failed

- Ensure Docker container is running: `docker ps`
- Check RabbitMQ logs: `docker logs rabbitmq`
- Verify credentials in `.env` files

### Redis Connection Failed

- Ensure Redis container is running: `docker ps`
- Check Redis logs: `docker logs order-redis`
- Verify password matches docker-compose.yaml

### Messages Not Processing

- Check RabbitMQ Management UI for queue status
- Verify consumers are running (check logs)
- Inspect Dead Letter Queue for failed messages

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.
