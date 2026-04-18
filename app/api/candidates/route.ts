import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";
import { listCandidatesWithPagination } from "@/lib/hiringCandidates";

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

  const data = await listCandidatesWithPagination(page, pageSize);

  return NextResponse.json(data);
}
