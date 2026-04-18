import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";
import { listCandidatesWithPagination, type CandidatesFilters } from "@/lib/hiringCandidates";

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

  const filters: CandidatesFilters = {};

  const submitted_from = searchParams.get("submitted_from");
  const submitted_to = searchParams.get("submitted_to");
  const min_years = searchParams.get("min_years");
  const max_years = searchParams.get("max_years");

  if (submitted_from) filters.submitted_from = submitted_from;
  if (submitted_to) filters.submitted_to = submitted_to;
  if (min_years) filters.min_years = Number(min_years);
  if (max_years) filters.max_years = Number(max_years);
  const submitted_order = searchParams.get("submitted_order");
  if (submitted_order === "asc" || submitted_order === "desc") {
    filters.submitted_order = submitted_order;
  }

  const data = await listCandidatesWithPagination(page, pageSize, filters);

  return NextResponse.json(data);
}
