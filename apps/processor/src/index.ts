import { Worker, Job, MetricsTime } from "bullmq";

import connection from "./lib/redis";
import { IDLE_SNAPSHOT_QUEUE } from "./utils/constants";
import {
  decodeFromBinary,
  encodeToBinary,
  makeLockKey,
  makeRoomSnapshotCacheKey,
  mergeSnapshotsWithPendingEvents,
} from "./utils/fns.js";

import { DrawEvent, DrawEventList } from "./lib/draw_event";

import { FnResult, makeError } from "../types/fnResult";

const worker = new Worker(
  IDLE_SNAPSHOT_QUEUE,
  async (job: Job<{ roomEventsKey: string; roomId: string }>) => {
    if (!job.data?.roomEventsKey || !job.data?.roomId) {
      throw new Error("Invalid job data");
    }

    //acquire a lock on pending events
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
    removeOnFail: { count: 10 },
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

    //FIXME: get from database and return

    return { success: true, error: null, data: null };
  } catch (error) {
    return { success: false, error: makeError(error), data: null };
  }
}

async function takeSnapshot(
  events: DrawEvent[],
  roomId: string
): Promise<FnResult<null>> {
  try {
    const encodedSnapshot = await encodeToBinary(events, Date.now());

    if (!encodedSnapshot.success) {
      throw encodedSnapshot.error;
    }

    await connection.set(
      makeRoomSnapshotCacheKey(roomId),
      encodedSnapshot.data
    );

    //FIXME: store the json snapshot in the database
    return { success: true, error: null, data: null };
  } catch (error) {
    return { success: false, error: makeError(error), data: null };
  }
}

worker.on("failed", (job, error) => {
  //FIXME: LOG THE ERROR
  console.error(`Job ${job?.id} failed with error: ${error.message}`);
});

worker.on("ready", () => {
  console.log("worker is ready");
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on("active", () => {
  console.debug("worker is active");
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
