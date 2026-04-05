import { Pool, type QueryResultRow } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var __arch2Pool: Pool | undefined;
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = globalThis.__arch2Pool ?? new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__arch2Pool = pool;
  }

  return pool;
}

export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}