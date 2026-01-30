# ADR 002: BullMQ for Dangling Event Cleanup and Snapshot Persistence

## Status

Accepted

## Context

Draw events can arrive rapidly, and writing each one directly to the database would be inefficient. To optimize performance, events are batched in memory, and a snapshot is persisted once a defined threshold is reached. However, if users in a room stop interacting before the threshold is met, dangling events remain unprocessed. Without a cleanup mechanism, these events would stay in memory indefinitely, leading to inconsistent state and potential data loss.
For example, if the threshold is set to 20 but users only generate 5 events, those 5 events would never be snapshotted and could be lost.

## Decision

We introduced BullMQ as a job queue backed by Redis. Each time a draw event is received, a cleanup job is published to the queue and the previous cleanup job is removed, effectively creating a debounced job queue. A dedicated processor worker consumes these jobs and ensures that dangling events are flushed and snapshotted reliably.

## Consequences

- Provides a reliable mechanism to flush incomplete batches, ensuring no user actions are lost.
- Offloads cleanup work from the main server, improving responsiveness
- Adds operational complexity (managing workers and queues).

## Alternatives Considered

- Direct DB writes from server: Rejected due to performance bottlenecks.
- Timeout-based cleanup: Rejected due to potential race conditions and complexity.
