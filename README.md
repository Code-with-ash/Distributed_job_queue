# ⚡ Redis PubSub Order Pipeline

A distributed order processing system using **Redis Pub/Sub fan-out** with independent worker services, built from first principles with **Node.js, Express, TypeScript, and Docker**.

---

## What This Does

When a user places an order, the API server publishes the order ID to a Redis Pub/Sub channel. Three independent worker services — **Email**, **Analytics**, and **Inventory** — all subscribe to this channel and process the order simultaneously. A real-time dashboard shows the lifecycle of each order as it flows through the pipeline.

```
                    ┌──────────────┐
                    │   Dashboard  │
                    │  (polls API) │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Express API │
                    │  POST /order │
                    └──────┬───────┘
                           │
                     PUBLISH orders
                           │
                    ┌──────▼───────┐
                    │  Redis 7     │
                    │  Pub/Sub     │
                    └──┬───┬───┬───┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │   📧 Email  │ │ 📊 Analytics│ │ 📦 Inventory│
   │   Worker    │ │   Worker    │ │   Worker    │
   └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Why Pub/Sub

**Pub/Sub fan-out** is the right pattern here because every order needs to be processed by **all three** services simultaneously. A work queue (`BRPOP`) delivers each job to exactly **one** competing consumer — which would mean only one service processes each order.

| Pattern | Delivery | Use Case |
|---------|----------|----------|
| **Pub/Sub** | Every subscriber gets every message | Fan-out to multiple independent services |
| **Work Queue** (`BRPOP`) | One consumer per message | Load balancing across identical workers |

---

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **API**: Express.js
- **Messaging**: Redis 7 Pub/Sub
- **Storage**: Redis Hashes + Lists
- **Containers**: Docker + Docker Compose
- **Frontend**: Vanilla HTML/CSS/JS

---

## Quick Start

### With Docker (recommended)

```bash
docker compose up --build
```

This starts **all 5 services** with one command:

| Container | Role |
|-----------|------|
| `pipeline_redis` | Redis 7 Alpine |
| `pipeline_api` | Express API (port 3000) |
| `pipeline_worker_email` | Email service worker |
| `pipeline_worker_analytics` | Analytics service worker |
| `pipeline_worker_inventory` | Inventory service worker |

Open **http://localhost:3000** to use the dashboard.

### Without Docker

```bash
# Start Redis separately
docker run -d -p 6379:6379 redis:7-alpine

# Install dependencies
npm install

# Terminal 1 — API server
npm run dev

# Terminal 2-4 — Workers (each in separate terminal)
npm run worker:email
npm run worker:analytics
npm run worker:inventory
```

---

## API Endpoints

### `POST /api/order`

Create a new order and publish it to all workers.

**Request**
```json
{ "items": ["Laptop", "Phone"] }
```

**Response** — `202 Accepted`
```json
{ "message": "Order placed", "orderId": "a1b2c3d4" }
```

### `GET /api/orders`

Returns the last 50 orders with per-service status.

**Response** — `200 OK`
```json
[
  {
    "id": "a1b2c3d4",
    "items": ["Laptop", "Phone"],
    "createdAt": "2026-07-29T18:00:00.000Z",
    "email": "done",
    "analytics": "processing",
    "inventory": "done"
  }
]
```

### `GET /api/order/:id`

Returns a single order by ID.

**Response** — `200 OK` or `404 Not Found`

---

## Redis Usage

### Data Structures

| Type | Key | Purpose |
|------|-----|---------|
| Hash | `order:{id}` | Stores order state (id, items, createdAt, per-service status) |
| List | `allOrders` | Tracks all order IDs for retrieval |
| Channel | `orders` | Pub/Sub channel for broadcasting order IDs to workers |

### Commands Used

| Command | Where | Why |
|---------|-------|-----|
| `HSET` | API + Workers | Write order fields and update service status |
| `HGETALL` | API | Read full order state for display |
| `LPUSH` | API | Track order IDs |
| `LRANGE` | API | Retrieve recent order IDs |
| `PUBLISH` | API | Broadcast order to Pub/Sub channel |
| `SUBSCRIBE` | Workers | Listen for new orders |

---

## Order Lifecycle

```
pending → processing → done
```

Each service field (`email`, `analytics`, `inventory`) transitions independently:

1. **Created** — API stores order with all fields set to `pending`
2. **Published** — `PUBLISH orders {orderId}`
3. **Processing** — Each worker sets its field to `processing`
4. **Done** — After simulated work, each worker sets its field to `done`

---

## Folder Structure

```
├── docker-compose.yaml          # Full stack: Redis + API + 3 workers
├── Dockerfile                   # Shared image for API and workers
├── .dockerignore
├── package.json
├── tsconfig.json
├── public/                      # Dashboard UI (served by Express)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── src/
    ├── index.ts                 # Express server (3 routes)
    ├── redis.ts                 # Redis client + subscriber factory
    ├── EmailService/main.ts     # Email worker
    ├── AnalyticService/main.ts  # Analytics worker
    └── InventoryUpdatedService/main.ts  # Inventory worker
```

---

## System Design Concepts Demonstrated

- **Pub/Sub fan-out** — one message delivered to multiple independent consumers
- **Event-driven architecture** — workers react to Redis messages, no polling
- **Asynchronous processing** — API returns immediately, workers process in background
- **State machine** — per-service `pending → processing → done` transitions
- **Service decomposition** — each worker is an independent process
- **Containerization** — full stack orchestrated via Docker Compose

---

## Known Limitations

This is a learning project built from first principles. The following are intentionally not implemented:

- **No retry logic or Dead Letter Queue** — failed operations are not retried
- **No error handling in workers** — simulated work always succeeds
- **No graceful shutdown** — workers don't handle `SIGTERM`
- **At-most-once delivery** — if a worker is offline, it misses messages (Pub/Sub limitation)
- **No authentication or rate limiting** — API is open
- **No tests** — focus was on architecture, not test coverage
- **No persistence for messages** — Redis Pub/Sub is fire-and-forget

For production, consider Redis Streams with consumer groups, BullMQ, RabbitMQ, or Kafka.
