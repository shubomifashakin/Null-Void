# ADR 001: Redis Adapter for WebSocket Scaling

## Status

Accepted

## Context

Our application relies heavily on WebSockets for real‑time collaboration (cursor updates, draw events, etc.). In a distributed deployment, multiple server instances run behind a load balancer. Without coordination, a WebSocket event sent to one server would not reach clients connected to other servers.

## Decision

We adopted the Redis Pub/Sub adapter for WebSockets. This allows all server instances to publish and subscribe to events through Redis, ensuring that messages are broadcast to every connected client regardless of which server they are attached to.

## Consequences

- Enables horizontal scaling of WebSocket servers.
- Ensures consistent event delivery across distributed instances.
- Introduces dependency on Redis availability for real‑time messaging.

## Alternatives Considered

- RabbitMQ: Rejected due to added complexity and operational overhead. Redis also offers better performance for pub/sub patterns.
- SQS: Rejected due to higher latency and complexity for real-time messaging.

## Future Considerations

- Evaluate other brokers (e.g., NATS, Kafka) if event throughput grows beyond Redis Pub/Sub capacity.
