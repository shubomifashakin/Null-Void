import { Worker, Job, MetricsTime } from "bullmq";
import { v4 as uuid } from "uuid";

import pgClient from "./lib/pg";
import connection from "./lib/redis";
import { DrawEvent, DrawEventList } from "./lib/draw_event";

import { IDLE_SNAPSHOT_QUEUE } from "./utils/constants";
import {
  decodeFromBinary,
  encodeToBinary,
  makeLockKey,
  makeRoomSnapshotCacheKey,
  mergeSnapshotsWithPendingEvents,
} from "./utils/fns";

import { FnResult, makeError } from "../types/fnResult";

const worker = new Worker(
  IDLE_SNAPSHOT_QUEUE,
  async (job: Job<{ roomEventsKey: string; roomId: string }>) => {
    if (!job.data?.roomEventsKey || !job.data?.roomId) {
      throw new Error("Invalid job data");
    }

    const acquiredLock = await connection.set(
      makeLockKey(job.data.roomEventsKey),
      "locked",
      "EX",
      20, //FIXME: SHOULD BE THE SAME AS the onee i set on backend
      "NX"
    );

    if (!acquiredLock) {
      return console.debug(
        `Failed to acquire lock for ${job.data.roomEventsKey}`
      );
    }

    const pendingEvents = await connection.hgetall(job.data.roomEventsKey);

    const pendingEventsArray = Object.values(pendingEvents).map(
      (event) => JSON.parse(event) as DrawEvent
    );

    if (!pendingEventsArray.length) {
      return console.debug(`No pending events for ${job.data.roomEventsKey}`);
    }

    const previousSnapshot = await getPreviousSnapshot(job.data.roomId);

    if (!previousSnapshot.success) {
      throw previousSnapshot.error;
    }

    //merge pending events and previous events to make new snapshot
    const mergedEvents = mergeSnapshotsWithPendingEvents(
      previousSnapshot.data?.events || [],
      pendingEventsArray
    );

    const snapshotTaken = await takeSnapshot(mergedEvents, job.data.roomId);

    if (!snapshotTaken.success) {
      throw snapshotTaken.error;
    }

    //delete pending events
    await connection.del(job.data.roomEventsKey);

    await connection.del(makeLockKey(job.data.roomEventsKey));
  },
  {
    connection,
    name: "idle-snapshots-worker",
    removeOnComplete: { count: 0 },
    removeOnFail: { count: 20 },
    metrics: { maxDataPoints: MetricsTime.ONE_HOUR },
    autorun: true,
  }
);

async function getPreviousSnapshot(
  roomId: string
): Promise<FnResult<DrawEventList | null>> {
  try {
    const previousSnapshot = await connection.getBuffer(
      makeRoomSnapshotCacheKey(roomId)
    );

    if (previousSnapshot) {
      return decodeFromBinary(previousSnapshot);
    }

    const result = await pgClient.query<{
      payload: DrawEvent[];
      timestamp: string;
    }>(
      'SELECT payload, timestamp FROM "Snapshots" WHERE room_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [roomId]
    );

    if (!result.rows.length) {
      return {
        success: true,
        error: null,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        events: result.rows[0]?.payload!,
        timestamp: result.rows[0]?.timestamp!,
      },
    };
  } catch (error) {
    return { success: false, error: makeError(error), data: null };
  }
}

async function takeSnapshot(
  events: DrawEvent[],
  roomId: string
): Promise<FnResult<null>> {
  try {
    const timestamp = new Date();
    const encodedSnapshot = await encodeToBinary(events, timestamp.getTime());

    if (!encodedSnapshot.success) {
      throw encodedSnapshot.error;
    }

    await connection.set(
      makeRoomSnapshotCacheKey(roomId),
      encodedSnapshot.data
    );

    await pgClient.query(
      'INSERT INTO "Snapshots" (id, room_id, payload, timestamp, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5, $6)',
      [uuid(), roomId, JSON.stringify(events), timestamp, timestamp, timestamp]
    );

    return { success: true, error: null, data: null };
  } catch (error) {
    return { success: false, error: makeError(error), data: null };
  }
}

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed with error: ${error.message}`);
});

worker.on("ready", () => {
  console.log("worker is ready");
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed`);
});

process.on("SIGINT", async () => {
  await worker.close();
  await pgClient.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  await pgClient.end();
  process.exit(0);
});
