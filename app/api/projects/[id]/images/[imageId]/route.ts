import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  await ensureSchema();

  const { id, imageId } = await params;

  const result = await query(
    `
      SELECT image_data, mime_type
      FROM project_images
      WHERE project_id = $1 AND id = $2
      LIMIT 1;
    `,
    [id, imageId]
  );

  if (!result.rows.length) {
    return new Response("Not found", { status: 404 });
  }

  const row = result.rows[0] as { image_data: Buffer | Uint8Array; mime_type: string };
  const data = row.image_data instanceof Buffer ? row.image_data : Buffer.from(row.image_data);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": row.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
