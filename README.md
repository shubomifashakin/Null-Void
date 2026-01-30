# Null-Void

## Description

This project is a distributed collaborative drawing system built as a monorepo. It demonstrates how to design and scale real‑time applications using modern backend technologies.
At its core, the system enables multiple users to collaborate live on a shared canvas, with features like cursor tracking, draw events, and room snapshots. The architecture is designed for scalability, fault tolerance, and performance, making it a strong example of distributed systems engineering. **It focuses more on backend architecture and distributed systems patterns than frontend design.**

## Architecture

![System Architecture](./docs/architecture-diagram.png)

_Figure: Distributed architecture showing frontend, backend, Redis layers, and background processing._

## Features

- Real‑time collaboration via WebSockets (live cursor tracking, draw events and many more...)
- Distributed WebSocket scaling using Redis Pub/Sub adapter.
- Background job processing with BullMQ.
- Dual Redis configuration for cache vs. durable state/queue.
- Monorepo structure with shared modules for clean code reuse.

## Project Structure

```
null-void/
├── docs/                   # Documentation
│   ├── ADRs/               # Architecture Decision Records
├── apps/
│   ├── server/              # Main NestJS server application
│   │   ├── prisma/          # Prisma schema and migrations
│   │   ├── proto/           # Proto files for draw events
│   │   ├── test/            # E2E Test files
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules (auth, rooms, accounts, etc.)
│   │   │   ├── core/        # Core application logic (database services, cache services etc.)
│   │   │   ├── common/      # Common utilities and helpers
│   │   │   ├── app.module.ts # Main application module
│   │   │   └── main.ts      # Application entry point
│   │   └── package.json     # Server dependencies
│   │
│   ├── processor/           # Background job processor/worker (BullMQ)
│   │   ├── proto/           # Proto files for draw events
│   │   ├── src/
│   │   │   ├── lib/        # Job handlers and processors
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   ├── utils/      # Utility functions
│   │   │   └── index.ts    # Processor entry point
│   │   ├── Dockerfile      # Processor Dockerfile
│   │   └── package.json     # Processor dependencies
│   │
│   └── shared/              # Shared code between apps
│       ├── src/
│       │   ├── types/       # TypeScript type definitions
│       │   ├── utils/       # Utility functions
│       │   └── constants/   # Shared constants
│       ├── index.ts         # Shared entry point
│       └── package.json     # Shared dependencies
│
├── ops/                     # Docker and deployment configs
│   ├── docker-compose.yml   # Docker orchestration
│   ├── cache-redis.conf     # Redis configuration for cache
│   ├── queue-redis.conf     # Redis configuration for queue
│
├── .env.server.example      # Server environment template
├── .env.processor.example   # Processor environment template
├── package.json             # Root workspace configuration
└── README.md                # This file
```

## Testing

Tests only exist for the server app.

```bash

$ cd apps/server

$ npm run test

$ npm run test:e2e

```

## Project Setup

- Clone the repository

```bash
$ git clone https://github.com/shubomifashakin/Null-Void.git
```

- Install dependencies

```bash
$ npm install
```

- Configure environment variables

```bash
$ cp .env.server.example apps/server/.env

$ cp .env.processor.example apps/processor/.env
```

- Build

```bash
$ npm run build
```

- Run dev server

```bash
$ npm run dev:server
```

- Run dev processor

```bash
$ npm run dev:processor
```

- Run migrations

```bash
cd apps/server

$ npx prisma migrate dev
```

## Running the Application Via Docker

```bash
$ cp .env.server.example ops/.env.server

$ cp .env.processor.example ops/.env.processor

$ docker build -f apps/server/Dockerfile -t null_void_server:latest .

$ docker build -f apps/processor/Dockerfile -t null_void_processor:latest .

$ cd ops

$ docker-compose up -d
```

## API Documentation

The API documentation is generated using Swagger/OpenAPI and is available at:

Local Development: http://localhost:PORT_USED/api/docs

The Swagger documentation is generated from code annotations, ensuring it stays in sync with the implementation. All endpoints, request/response DTOs, and authentication requirements are documented with examples and schemas.
