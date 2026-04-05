import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { projectSchema } from "@/lib/validators";
import {
  ProjectRecord,
  type ExistingImageInput,
  type NewImageInput,
  type ProjectImageInput
} from "@/lib/types";

function toProjectRecord(row: Record<string, unknown>): ProjectRecord {
  const images = Array.isArray(row.images) ? row.images : [];

  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    images: images as ProjectRecord["images"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function existingImagePayload(image: ProjectImageInput): image is ExistingImageInput {
  return "id" in image;
}

function newImagePayload(image: ProjectImageInput): image is NewImageInput {
  return "dataBase64" in image;
}

async function getAllProjects() {
  const result = await query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'filename', pi.filename,
              'mimeType', pi.mime_type,
              'url', '/api/projects/' || p.id || '/images/' || pi.id
            )
            ORDER BY pi.created_at
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::jsonb
        ) AS images
      FROM projects p
      LEFT JOIN project_images pi ON pi.project_id = p.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC, p.created_at DESC;
    `
  );

  return result.rows.map((row) => toProjectRecord(row as Record<string, unknown>));
}

export async function GET() {
  await ensureSchema();

  return NextResponse.json(await getAllProjects());
}

export async function POST(request: Request) {
  await ensureSchema();

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description, images } = parsed.data;
  const newImages = images.filter(newImagePayload);

  if (newImages.length < 1) {
    return NextResponse.json(
      { error: "At least one newly uploaded image is required when creating a project." },
      { status: 400 }
    );
  }

  const result = await query(
    `
      INSERT INTO projects (name, description)
      VALUES ($1, $2)
      RETURNING id;
    `,
    [name, description]
  );

  const projectId = String((result.rows[0] as Record<string, unknown>).id);

  for (const image of newImages) {
    await query(
      `
        INSERT INTO project_images (project_id, filename, mime_type, image_data)
        VALUES ($1, $2, $3, decode($4, 'base64'));
      `,
      [projectId, image.filename, image.mimeType, image.dataBase64]
    );
  }

  const projects = await getAllProjects();
  const created = projects.find((project) => project.id === projectId);

  if (!created) {
    return NextResponse.json({ error: "Project was created but could not be fetched." }, { status: 500 });
  }

  return NextResponse.json(created);
}
