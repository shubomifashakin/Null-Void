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
  async (job: Job<{ roomEventsId: string; roomId: string }>) => {
    const pendingEvents = await connection.hgetall(job.data.roomEventsId);

    //get previous snapshot

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
