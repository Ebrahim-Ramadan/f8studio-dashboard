import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getProjectById, listProjectsWithPaginationAndPreview, normalizePreviewLimit } from "@/lib/projects";
import { projectSchema } from "@/lib/validators";
import { type NewImageInput, type ProjectImageInput } from "@/lib/types";

function newImagePayload(image: ProjectImageInput): image is NewImageInput {
  return "dataBase64" in image;
}

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "6", 10);
  const previewLimit = normalizePreviewLimit(searchParams.get("previewImages"));

  return NextResponse.json(
    await listProjectsWithPaginationAndPreview(page, pageSize, previewLimit)
  );
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

  // Ensure at most one image is marked as front
  const frontCount = images.filter((img: any) => (img as any).isFront).length;
  if (frontCount > 1) {
    return NextResponse.json({ error: "Only one image may be marked as front." }, { status: 400 });
  }

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

  // If exactly one image was uploaded for this new project and no front flag was provided,
  // automatically mark that image as the front image.
  const autoFront = newImages.length === 1 && frontCount === 0;

  for (const [idx, image] of newImages.entries()) {
    const providedIsFront = Boolean((image as any).isFront);
    const isFront = autoFront ? true : providedIsFront;
    await query(
      `
        INSERT INTO project_images (project_id, filename, mime_type, image_data, is_front)
        VALUES ($1, $2, $3, decode($4, 'base64'), $5);
      `,
      [projectId, image.filename, image.mimeType, image.dataBase64, isFront]
    );
  }

  const created = await getProjectById(projectId);

  if (!created) {
    return NextResponse.json({ error: "Project was created but could not be fetched." }, { status: 500 });
  }

  return NextResponse.json(created);
}
