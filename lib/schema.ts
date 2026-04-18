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
          is_front boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      // If table existed before adding is_front, ensure the column exists
      await query(`
        ALTER TABLE project_images
        ADD COLUMN IF NOT EXISTS is_front boolean NOT NULL DEFAULT false;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name varchar(150) NOT NULL,
          email varchar(255) NOT NULL,
          phone varchar(50),
          project_type varchar(120),
          message text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      // Create indexes for better query performance
      await query(`
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
        ON contact_submissions(created_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_email 
        ON contact_submissions(email);
      `);
    })();
  }

  return ensurePromise;
}