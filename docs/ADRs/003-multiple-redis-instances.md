# ADR 003: Multiple Redis Instances (Cache vs State/Queue)

## Status

Accepted

## Context

Redis is used for rate limiting, caching API responses and storing critical collaborative state/queue data. These workloads have conflicting requirements:

- Cache Redis must support eviction policies (e.g., LRU) to efficiently manage memory for non‑critical, ephemeral data.
- State/Queue Redis must be durable and configured with no eviction to avoid losing critical events such as draw batches, room state, or queued jobs.

Using a single Redis instance for both would force these workloads to compete for memory, risking eviction of important collaborative data.

## Decision

We deployed two separate Redis instances to isolate responsibilities:

- Cache Redis → eviction enabled, used for API caching, rate limiting, and other non‑critical operations.
- State/Queue Redis → no eviction, persistence enabled, used for BullMQ queues, room state, draw event batching, and other critical operations.

## Consequences

- Clear separation of concerns between ephemeral cache and durable state.
- Prevents accidental eviction of critical collaborative data.
- Slightly higher operational overhead (managing two Redis clusters).

## Alternatives Considered

- Single Redis instance with no eviction: Rejected, as it would consume more memory and degrade performance. Cached data, rate limiting keys, and collaborative events would all compete for memory, increasing risk of instability.
