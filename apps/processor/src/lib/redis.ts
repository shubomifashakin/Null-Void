import Redis from "ioredis";
import { redisPort, redisHost } from "./config";

export const connection = new Redis({
  maxRetriesPerRequest: null,
  port: redisPort,
  host: redisHost,
  name: "idle-snapshots-worker",
});

export default connection;
