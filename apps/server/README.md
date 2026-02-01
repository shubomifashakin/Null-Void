# Null Void Server

The Server is the main backend service for the Null Void collaborative drawing system. It handles HTTP requests, WebSocket connections, real-time communication, and integrates with the Processor and Cache services to manage collaborative drawing sessions.

## Responsibilities

- Handles HTTP requests for room management, account management, and authentication.
- Manages WebSocket connections and real-time communication.
- Integrates with the Processor and Cache services to manage collaborative drawing sessions.
- Provides REST API endpoints for client interactions.
- Ensures real-time updates and synchronization across clients.

# Project Structure

```
server/
├── prisma/ # Prisma configuration
├── proto/ # Protocol buffers
├── src/ # Business logic
│ ├──   core/ # Core business logic
│ │ ├── common/ # Common utilities
│ │ └── modules/ # Module-specific business logic
│ │ ├── accounts/ # Account management logic
│ │ ├── auth/ # Authentication logic
│ │ ├── health/ # Health check endpoints
│ │ ├── metrics/ # Metrics endpoints
│ │ └── rooms/ # Room management logic
│ ├── types/ # TypeScript type definitions
│ ├── app.module.ts # Application and module entry points
│ └── main.ts # Main entry point
```
