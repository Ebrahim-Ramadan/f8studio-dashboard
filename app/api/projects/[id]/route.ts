import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getProjectById } from "@/lib/projects";
import { projectSchema } from "@/lib/validators";
import {
  type ExistingImageInput,
  type NewImageInput,
  type ProjectImageInput
} from "@/lib/types";

function existingImagePayload(image: ProjectImageInput): image is ExistingImageInput {
  return "id" in image;
}

function newImagePayload(image: ProjectImageInput): image is NewImageInput {
  return "dataBase64" in image;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();

  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
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
      SET
        name = $2,
        description = $3,
        created_at = COALESCE($4::timestamptz, created_at),
        updated_at = now()
      WHERE id = $1
    `,
    [id, parsed.data.name, parsed.data.description, parsed.data.createdAt ?? null]
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
