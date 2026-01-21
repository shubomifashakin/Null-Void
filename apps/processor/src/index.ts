import { Worker, Job, MetricsTime } from "bullmq";
import IORedis from "ioredis";

import dotenv from "dotenv";

dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT!);
const redisHost = process.env.REDIS_HOST!;

if (!redisHost || !redisPort) throw new Error("Redis config is Null");

const connection = new IORedis.Redis({
  maxRetriesPerRequest: null,
  port: redisPort,
  host: redisHost,
  name: "idle-snapshots-worker",
});

const worker = new Worker(
  "idle-snapshots",
  async (job: Job<{ roomEventsKey: string; roomId: string }>) => {
    if (!job.data?.roomEventsKey || !job.data?.roomId) {
      throw new Error("Invalid job data");
    }

    //acquire a lock on pending events
    const acquiredLock = await connection.set(
      `lock:${job.data.roomEventsKey}`,
      "locked",
      "EX",
      20, //FIXME: SHOULD BE THE SAME AS the onee i set on backend
      "NX"
    );

    if (!acquiredLock) {
      console.debug(`Failed to acquire lock for ${job.data.roomEventsKey}`);

      return;
    }

    const pendingEvents = await connection.hgetall(job.data.roomEventsKey);

    //get previous snapshot
    const previousSnapshot = await connection.getBuffer(
      `room:${job.data.roomId}:snapshots`
    );

    console.log("previousSnapshot", previousSnapshot);

    //decode the previous snapshot if present

    //merge pending events and previous events to make new snapshot

    //encode the new snapshot as binary

    //store the encoded snapshot in redis

    // store the json snapshot in the database

    console.log("pendingEvents", pendingEvents);
  },
  {
    connection,
    name: "idle-snapshots-worker",
    removeOnComplete: { count: 0 },
    metrics: { maxDataPoints: MetricsTime.ONE_WEEK },
    autorun: true,
  }
);

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
