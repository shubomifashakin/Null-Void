import dotenv from "dotenv";

dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT!);
const redisHost = process.env.REDIS_HOST!;
const databaseUrl = process.env.DATABASE_URL!;

if (!redisHost || !redisPort) throw new Error("Redis config is Null");
if (!databaseUrl) throw new Error("Database URL is Null");

export { redisPort, redisHost, databaseUrl };
