import dotenv from "dotenv";
import path from "node:path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env.postgres.local") });

export const createAllurePostgresPool = (): Pool => {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
    });
  }

  const requiredSettings = ["PGDATABASE", "PGUSER", "PGPASSWORD"] as const;
  const missingSettings = requiredSettings.filter((setting) => !process.env[setting]?.trim());

  if (missingSettings.length > 0) {
    throw new Error(
      `PostgreSQL config is missing ${missingSettings.join(", ")}. ` +
        "Set DATABASE_URL or PGDATABASE, PGUSER, and PGPASSWORD in .env.postgres.local.",
    );
  }

  const port = Number(process.env.PGPORT ?? "5432");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PGPORT must be an integer between 1 and 65535.");
  }

  return new Pool({
    host: process.env.PGHOST?.trim() || "127.0.0.1",
    port,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    connectionTimeoutMillis: 5000,
  });
};
