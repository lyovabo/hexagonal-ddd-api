# hexagonal-ddd-api

Production-ready Node.js REST API built with **Hexagonal Architecture (Ports & Adapters)** and **Domain-Driven Design**, backed by PostgreSQL, Redis, and Kafka — deployable via Docker Compose or Kubernetes.

---

## Architecture

```
src/
├── domain/                        # Core business logic (no dependencies)
│   ├── entities/                  # Aggregates and entities
│   │   ├── Entity.ts              # Base entity with domain events
│   │   └── Order.ts               # Order aggregate root
│   ├── value-objects/             # Immutable value types
│   │   ├── Money.ts
│   │   ├── OrderItem.ts
│   │   └── OrderStatus.ts
│   ├── events/                    # Domain events
│   │   ├── DomainEvent.ts
│   │   ├── OrderCreatedEvent.ts
│   │   └── OrderStatusChangedEvent.ts
│   └── repositories/              # Repository interfaces (contracts)
│       └── OrderRepository.ts
│
├── application/                   # Use cases and orchestration
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   ├── GetOrderUseCase.ts
│   │   ├── UpdateOrderStatusUseCase.ts
│   │   └── OrderMapper.ts
│   ├── ports/
│   │   ├── out/
│   │   │   ├── EventPublisher.ts  # Kafka port interface
│   │   │   └── CachePort.ts       # Redis port interface
│   └── dtos/
│       └── OrderDto.ts
│
└── infrastructure/                # External adapters
    ├── persistence/
    │   ├── postgres/
    │   │   ├── pool.ts
    │   │   ├── repositories/      # PostgresOrderRepository
    │   │   └── migrations/        # SQL migrations
    │   └── redis/
    │       └── RedisCache.ts      # CachePort implementation
    ├── messaging/kafka/
    │   ├── producers/             # KafkaEventPublisher
    │   └── consumers/             # OrderEventsConsumer
    └── http/
        ├── controllers/
        ├── middlewares/
        └── routes/
```

### Dependency Rule

```
HTTP → Application → Domain ← Infrastructure
          ↑                         ↓
       Ports/Interfaces  ←  Adapters (Postgres, Redis, Kafka)
```

The domain layer has **zero external dependencies**. All I/O is injected through interfaces.

---

## Tech Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Runtime      | Node.js 20, TypeScript 5      |
| Framework    | Express 4                     |
| Database     | PostgreSQL 16                 |
| Cache        | Redis 7                       |
| Messaging    | Kafka (KafkaJS), Zookeeper    |
| Containers   | Docker, Docker Compose        |
| Orchestration| Kubernetes + Kustomize        |
| CI/CD        | GitHub Actions                |
| Testing      | Jest, ts-jest                 |
| Validation   | Joi                           |
| Logging      | Winston                       |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- `npm` or `yarn`

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/hexagonal-ddd-api.git
cd hexagonal-ddd-api
npm install
cp .env.example .env
```

### 2. Start infrastructure + API

```bash
npm run docker:up
```

This starts: PostgreSQL, Redis, Kafka, Zookeeper, Kafka UI, and the API.

### 3. Run in dev mode (hot reload)

```bash
npm run dev
```

API is available at `http://localhost:3000`
Kafka UI at `http://localhost:8080`

---

## API Endpoints

### Health

```
GET  /health/live        # Liveness probe
GET  /health/ready       # Readiness (checks Postgres, Redis, Kafka)
```

### Orders

```
POST   /api/v1/orders              # Create order
GET    /api/v1/orders/:id          # Get order by ID (cached in Redis)
PATCH  /api/v1/orders/:id/confirm  # Confirm order
PATCH  /api/v1/orders/:id/ship     # Ship order
PATCH  /api/v1/orders/:id/cancel   # Cancel order
```

### Example: Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-001",
    "items": [
      {
        "productId": "prod-001",
        "productName": "Laptop",
        "quantity": 1,
        "unitPrice": 999.99,
        "currency": "USD"
      }
    ]
  }'
```

---

## Testing

```bash
npm test                  # All tests with coverage
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

---

## Kubernetes Deployment

### Dev cluster (e.g. minikube)

```bash
kubectl apply -k k8s/overlays/dev
```

### Production

```bash
# Update image tag in k8s/overlays/prod/kustomization.yaml, then:
kubectl apply -k k8s/overlays/prod
```

### Check rollout

```bash
kubectl rollout status deployment/hexagonal-ddd-api -n hexagonal-ddd
kubectl get pods -n hexagonal-ddd
kubectl logs -f deployment/hexagonal-ddd-api -n hexagonal-ddd
```

---

## CI/CD (GitHub Actions)

On every push to `main`:
1. Lint & TypeScript build check
2. Unit + integration tests
3. Docker image built and pushed to GitHub Container Registry (`ghcr.io`)

On pull requests to `main`: lint + test only.

---

## Push to GitHub with Claude Code

```bash
# Install Claude Code
npm install -g @anthropic/claude-code

# From the project root
claude

# Then tell Claude:
# "Initialize a git repo, create a GitHub repo called hexagonal-ddd-api, and push everything"
```

Or manually:

```bash
git init
git add .
git commit -m "feat: initial hexagonal DDD architecture"
git remote add origin https://github.com/YOUR_USERNAME/hexagonal-ddd-api.git
git push -u origin main
```

---

## Domain Events Flow

```
HTTP Request
    ↓
OrderController
    ↓
CreateOrderUseCase
    ↓
Order.create()  →  OrderCreatedEvent (domain event)
    ↓
PostgresOrderRepository.save()
    ↓
KafkaEventPublisher.publish("orders.order.created")
    ↓
OrderEventsConsumer (async processing)
```

---

## License

MIT
