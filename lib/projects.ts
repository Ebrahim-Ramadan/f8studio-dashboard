import { query } from "@/lib/db";
import { ProjectRecord, ProjectsResponse } from "@/lib/types";

function toProjectRecord(row: Record<string, unknown>): ProjectRecord {
  const images = Array.isArray(row.images) ? row.images : [];
  const imageCount = Number(row.image_count ?? images.length ?? 0);

  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    images: images as ProjectRecord["images"],
    imageCount,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export function normalizePreviewLimit(rawValue: string | null | undefined) {
  const requestedLimit = Number(rawValue ?? "2");

  if (!Number.isFinite(requestedLimit)) {
    return 2;
  }

  return Math.max(1, Math.min(6, Math.floor(requestedLimit)));
}

export async function listProjectsWithPreview(previewLimit: number) {
  const result = await query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COALESCE(pic.image_count, 0) AS image_count,
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
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS image_count
        FROM project_images
        WHERE project_id = p.id
      ) pic ON true
      LEFT JOIN LATERAL (
        SELECT id, filename, mime_type, created_at
        FROM project_images
        WHERE project_id = p.id
        ORDER BY created_at
        LIMIT CASE WHEN pic.image_count <= $1 THEN pic.image_count ELSE $1 END
      ) pi ON true
      GROUP BY p.id, pic.image_count
      ORDER BY p.updated_at DESC, p.created_at DESC;
    `,
    [previewLimit]
  );

  return result.rows.map((row) => toProjectRecord(row as Record<string, unknown>));
}

export async function getProjectById(id: string) {
  const result = await query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COALESCE(
          (
            SELECT COUNT(*)::int
            FROM project_images pi_count
            WHERE pi_count.project_id = p.id
          ),
          0
        ) AS image_count,
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

export async function listProjectsWithPaginationAndPreview(
  page: number = 1,
  pageSize: number = 6,
  previewLimit: number = 2
): Promise<ProjectsResponse> {
  // Validate pagination params
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const offset = (validPage - 1) * validPageSize;

  const result = await query<Record<string, unknown> & { total_count: number }>(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COALESCE(pic.image_count, 0) AS image_count,
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
        ) AS images,
        COUNT(*) OVER() AS total_count
      FROM projects p
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS image_count
        FROM project_images
        WHERE project_id = p.id
      ) pic ON true
      LEFT JOIN LATERAL (
        SELECT id, filename, mime_type, created_at
        FROM project_images
        WHERE project_id = p.id
        ORDER BY created_at
        LIMIT CASE WHEN pic.image_count <= $1 THEN pic.image_count ELSE $1 END
      ) pi ON true
      GROUP BY p.id, pic.image_count
      ORDER BY p.updated_at DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [previewLimit, validPageSize, offset]
  );

  const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0;
  const totalPages = Math.ceil(totalCount / validPageSize);

  return {
    projects: result.rows.map((row) => toProjectRecord(row)),
    total: totalCount,
    page: validPage,
    pageSize: validPageSize,
    totalPages
  };
}
