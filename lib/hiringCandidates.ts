import { query } from "@/lib/db";

export type HiringCandidateRecord = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  portfolio: string | null;
  years_experience: number | null;
  main_field: string | null;
  software_skills: unknown[];
  visualization_level: string | null;
  ai_tools: unknown[];
  ai_usage: unknown[];
  ai_use_behavior: string | null;
  prompt_skill: string | null;
  ai_importance: string | null;
  design_style: string | null;
  contrast_preference: string | null;
  design_tendency: string | null;
  design_focus: string | null;
  start_approach: string | null;
  problem_approach: unknown[];
  feedback_handling: string | null;
  under_pressure: string | null;
  work_environment: string | null;
  scenario_response: string | null;
  portfolio_project: string | null;
  portfolio_why: string | null;
  final_filter: string | null;
  current_salary: string | null;
  expected_salary: string | null;
  created_at: string;
};

export type CandidatesResponse = {
  candidates: HiringCandidateRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CandidatesFilters = {
  submitted_from?: string | null;
  submitted_to?: string | null;
  min_years?: number | null;
  max_years?: number | null;
  submitted_order?: "asc" | "desc" | null;
};

export async function listCandidatesWithPagination(
  page: number = 1,
  pageSize: number = 10,
  filters?: CandidatesFilters
): Promise<CandidatesResponse> {
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const offset = (validPage - 1) * validPageSize;

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters) {
    if (filters.submitted_from) {
      params.push(filters.submitted_from);
      whereClauses.push(`created_at >= $${params.length}`);
    }
    if (filters.submitted_to) {
      params.push(filters.submitted_to);
      whereClauses.push(`created_at <= $${params.length}`);
    }
    if (typeof filters.min_years === "number") {
      params.push(filters.min_years);
      whereClauses.push(`years_experience >= $${params.length}`);
    }
    if (typeof filters.max_years === "number") {
      params.push(filters.max_years);
      whereClauses.push(`years_experience <= $${params.length}`);
    }
  }

  // push limit and offset as last params
  params.push(validPageSize, offset);

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const orderSQL = filters?.submitted_order === "asc" ? "created_at ASC" : "created_at DESC";

  const result = await query<Record<string, unknown> & { total_count: number }>(
    `
      SELECT
        id,
        full_name,
        phone,
        email,
        portfolio,
        years_experience,
        main_field,
        software_skills,
        visualization_level,
        ai_tools,
        ai_usage,
        ai_use_behavior,
        prompt_skill,
        ai_importance,
        design_style,
        contrast_preference,
        design_tendency,
        design_focus,
        start_approach,
        problem_approach,
        feedback_handling,
        under_pressure,
        work_environment,
        scenario_response,
        portfolio_project,
        portfolio_why,
        final_filter,
        current_salary,
        expected_salary,
        created_at,
        COUNT(*) OVER() AS total_count
      FROM hiring_candidates
      ${whereSQL}
      ORDER BY ${orderSQL}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );

  const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0;
  const totalPages = Math.ceil(totalCount / validPageSize);

  const candidates = result.rows.map((row) => {
    return {
      id: String(row.id),
      full_name: row.full_name == null ? "" : String(row.full_name),
      phone: row.phone == null ? null : String(row.phone),
      email: row.email == null ? "" : String(row.email),
      portfolio: row.portfolio == null ? null : String(row.portfolio),
      years_experience: row.years_experience == null ? null : Number(row.years_experience),
      main_field: row.main_field == null ? null : String(row.main_field),
      software_skills: Array.isArray(row.software_skills) ? row.software_skills : [],
      visualization_level: row.visualization_level == null ? null : String(row.visualization_level),
      ai_tools: Array.isArray(row.ai_tools) ? row.ai_tools : [],
      ai_usage: Array.isArray(row.ai_usage) ? row.ai_usage : [],
      ai_use_behavior: row.ai_use_behavior == null ? null : String(row.ai_use_behavior),
      prompt_skill: row.prompt_skill == null ? null : String(row.prompt_skill),
      ai_importance: row.ai_importance == null ? null : String(row.ai_importance),
      design_style: row.design_style == null ? null : String(row.design_style),
      contrast_preference: row.contrast_preference == null ? null : String(row.contrast_preference),
      design_tendency: row.design_tendency == null ? null : String(row.design_tendency),
      design_focus: row.design_focus == null ? null : String(row.design_focus),
      start_approach: row.start_approach == null ? null : String(row.start_approach),
      problem_approach: Array.isArray(row.problem_approach) ? row.problem_approach : [],
      feedback_handling: row.feedback_handling == null ? null : String(row.feedback_handling),
      under_pressure: row.under_pressure == null ? null : String(row.under_pressure),
      work_environment: row.work_environment == null ? null : String(row.work_environment),
      scenario_response: row.scenario_response == null ? null : String(row.scenario_response),
      portfolio_project: row.portfolio_project == null ? null : String(row.portfolio_project),
      portfolio_why: row.portfolio_why == null ? null : String(row.portfolio_why),
      final_filter: row.final_filter == null ? null : String(row.final_filter),
      current_salary: row.current_salary == null ? null : String(row.current_salary),
      expected_salary: row.expected_salary == null ? null : String(row.expected_salary),
      created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString()
    } as HiringCandidateRecord;
  });

  return {
    candidates,
    total: totalCount,
    page: validPage,
    pageSize: validPageSize,
    totalPages
  };
}
