import { Pool } from "pg";
import { databaseUrl } from "./config";

const pgPool = new Pool({
  connectionString: databaseUrl,
  statement_timeout: 10000,
  idle_in_transaction_session_timeout: 10000,
  connectionTimeoutMillis: 5000,
  application_name: "idle-snapshot-worker",
  min: 2,
  max: 10,
});

export default pgPool;
