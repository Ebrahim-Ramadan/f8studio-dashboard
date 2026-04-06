import { query } from "@/lib/db";
import { ContactSubmission, SubmissionsResponse } from "@/lib/types";

interface SubmissionRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  created_at: string;
  total_count: number;
}

function toContactSubmission(row: SubmissionRow): ContactSubmission {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    projectType: row.project_type,
    message: row.message,
    createdAt: row.created_at
  };
}

export async function listSubmissions(
  page: number = 1,
  pageSize: number = 10
): Promise<SubmissionsResponse> {
  // Validate pagination params
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const offset = (validPage - 1) * validPageSize;

  const result = await query<SubmissionRow>(
    `
      SELECT 
        id,
        full_name,
        email,
        phone,
        project_type,
        message,
        created_at,
        COUNT(*) OVER() AS total_count
      FROM contact_submissions
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [validPageSize, offset]
  );

  const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count as unknown as string) : 0;
  const totalPages = Math.ceil(totalCount / validPageSize);

  return {
    submissions: result.rows.map(toContactSubmission),
    total: totalCount,
    page: validPage,
    pageSize: validPageSize,
    totalPages
  };
}
