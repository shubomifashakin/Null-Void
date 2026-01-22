import dotenv from "dotenv";

dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT!);
const redisHost = process.env.REDIS_HOST!;
const databaseUrl = process.env.DATABASE_URL!;
const logLevel = process.env.LOG_LEVEL || "info";
const NODE_ENV = process.env.NODE_ENV || "development";
const LOCK_TTL = parseInt(process.env.LOCK_TTL!);

if (!redisHost || !redisPort) throw new Error("Redis config is Null");
if (!databaseUrl) throw new Error("Database URL is Null");
if (!LOCK_TTL) throw new Error("Lock TTL is Null");

export { redisPort, redisHost, databaseUrl, logLevel, NODE_ENV, LOCK_TTL };
