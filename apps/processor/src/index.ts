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
  name: "persist-snapshots-worker",
});

const worker = new Worker(
  "persist-snapshot",
  async (job: Job<{ roomId: string; snapshotKey: string }>) => {
    console.log("the job data", job.data);
    const snapshot = await connection.get(job.data.snapshotKey);

    //decode from binary

    // store the snapshot in the database

    console.log("snapshot", snapshot);
  },
  {
    connection,
    name: "persist-snapshots-worker",
    removeOnComplete: { count: 0 },
    metrics: { maxDataPoints: MetricsTime.ONE_WEEK },
    autorun: true,
  },
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
  console.log("worker is active");
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

console.log("ran");
