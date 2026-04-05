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

async function getProjectById(id: string) {
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
      WHERE p.id = $1
      GROUP BY p.id;
    `,
    [id]
  );

  if (!result.rows.length) {
    return null;
  }

  return toProjectRecord(result.rows[0] as Record<string, unknown>);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();

  const { id } = await params;
  const body = await request.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existingResult = await query(`SELECT id FROM projects WHERE id = $1`, [id]);

  if (!existingResult.rows.length) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const nextImages = parsed.data.images;
  const keepImageIds = nextImages.filter(existingImagePayload).map((image) => image.id);
  const newImages = nextImages.filter(newImagePayload);

  await query(
    `
      UPDATE projects
      SET name = $2, description = $3, updated_at = now()
      WHERE id = $1
    `,
    [id, parsed.data.name, parsed.data.description]
  );

  if (keepImageIds.length > 0) {
    await query(
      `
        DELETE FROM project_images
        WHERE project_id = $1
          AND id <> ALL($2::uuid[]);
      `,
      [id, keepImageIds]
    );
  } else {
    await query(`DELETE FROM project_images WHERE project_id = $1`, [id]);
  }

  for (const image of newImages) {
    await query(
      `
        INSERT INTO project_images (project_id, filename, mime_type, image_data)
        VALUES ($1, $2, $3, decode($4, 'base64'));
      `,
      [id, image.filename, image.mimeType, image.dataBase64]
    );
  }

  const updated = await getProjectById(id);

  if (!updated) {
    return NextResponse.json({ error: "Project updated but could not be fetched." }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();

  const { id } = await params;

  const existingResult = await query(`SELECT id FROM projects WHERE id = $1`, [id]);

  if (!existingResult.rows.length) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await query(`DELETE FROM projects WHERE id = $1`, [id]);

  return NextResponse.json({ ok: true });
}
