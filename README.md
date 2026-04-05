# Architect Office Admin Dashboard

Minimal Next.js admin dashboard for architectural office projects.

## What it does

- Add, edit, and delete projects
- Store project data in Neon Postgres
- Store multiple project images directly in Neon (`bytea`)
- No authentication
- Works on Vercel

## Environment variables

Set these values before running the app:

- `DATABASE_URL`

## Notes

Images are not written to the local app directory on Vercel. The app stores file bytes in Neon Postgres (`project_images.image_data`) and serves them from `/api/projects/:id/images/:imageId`.

Database tables are created automatically when the app runs.
