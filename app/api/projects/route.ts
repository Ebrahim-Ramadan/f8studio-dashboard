import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getProjectById, listProjectsWithPreview, normalizePreviewLimit } from "@/lib/projects";
import { projectSchema } from "@/lib/validators";
import { type NewImageInput, type ProjectImageInput } from "@/lib/types";

function newImagePayload(image: ProjectImageInput): image is NewImageInput {
  return "dataBase64" in image;
}

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const previewLimit = normalizePreviewLimit(searchParams.get("previewImages"));

  return NextResponse.json(await listProjectsWithPreview(previewLimit));
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

  const { name, description, images, createdAt } = parsed.data;
  const newImages = images.filter(newImagePayload);

  if (newImages.length < 1) {
    return NextResponse.json(
      { error: "At least one newly uploaded image is required when creating a project." },
      { status: 400 }
    );
  }

  const result = await query(
    `
      INSERT INTO projects (name, description, created_at)
      VALUES ($1, $2, COALESCE($3::timestamptz, now()))
      RETURNING id;
    `,
    [name, description, createdAt ?? null]
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

  const created = await getProjectById(projectId);

  if (!created) {
    return NextResponse.json({ error: "Project was created but could not be fetched." }, { status: 500 });
  }

  return NextResponse.json(created);
}
