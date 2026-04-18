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
  const frontCount = nextImages.filter((img: any) => (img as any).isFront).length;
  if (frontCount > 1) {
    return NextResponse.json({ error: "Only one image may be marked as front." }, { status: 400 });
  }
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

  // Clear existing front flag for this project; we'll set it below based on input
  await query(`UPDATE project_images SET is_front = false WHERE project_id = $1`, [id]);

  for (const image of newImages) {
    const isFront = Boolean((image as any).isFront);
    await query(
      `
        INSERT INTO project_images (project_id, filename, mime_type, image_data, is_front)
        VALUES ($1, $2, $3, decode($4, 'base64'), $5);
      `,
      [id, image.filename, image.mimeType, image.dataBase64, isFront]
    );
  }

  // If any existing image was marked as front, set it now
  const existingFront = nextImages.filter(existingImagePayload).find((img: any) => (img as any).isFront);
  if (existingFront) {
    await query(`UPDATE project_images SET is_front = true WHERE id = $1 AND project_id = $2`, [existingFront.id, id]);
  }

  // Ensure only one image is marked as front for this project. If multiple are true
  // (due to concurrent edits or unexpected state), keep the most recently created/inserted one.
  await query(
    `
      WITH fronts AS (
        SELECT id
        FROM project_images
        WHERE project_id = $1 AND is_front = true
        ORDER BY created_at DESC
      )
      UPDATE project_images
      SET is_front = (id = (SELECT id FROM fronts LIMIT 1))
      WHERE project_id = $1;
    `,
    [id]
  );

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
