# Processor

The Processor is a BullMQ worker responsible for handling background jobs in the collaborative canvas system. It ensures that dangling draw events and other batched operations are reliably processed and persisted, offloading heavy work from the main server.

## Responsibilities

- Consumes jobs from the Queue Redis instance.
- Cleans up dangling events that never reach the batching threshold.
- Persists snapshots of room state and draw events.
- Updates the latest snapshot in the Queue Redis instance.
- Ensures durability and consistency even if servers restart.
