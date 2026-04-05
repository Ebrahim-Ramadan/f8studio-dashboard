import { query } from "@/lib/db";

let ensurePromise: Promise<void> | null = null;

export function ensureSchema() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS projects (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text NOT NULL,
          images jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS project_images (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          filename text NOT NULL,
          mime_type text NOT NULL,
          image_data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);
    })();
  }

  return ensurePromise;
}