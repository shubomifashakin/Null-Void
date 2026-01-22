import dotenv from "dotenv";

dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT!);
const redisHost = process.env.REDIS_HOST!;

if (!redisHost || !redisPort) throw new Error("Redis config is Null");

export { redisPort, redisHost };
