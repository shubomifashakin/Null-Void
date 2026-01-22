import { Client } from "pg";
import { databaseUrl } from "./config";

const pgClient = new Client({
  connectionString: databaseUrl,
  statement_timeout: 10000,
  idle_in_transaction_session_timeout: 10000,
  connectionTimeoutMillis: 5000,
  application_name: "idle-snapshot-worker",
});

export default pgClient;
