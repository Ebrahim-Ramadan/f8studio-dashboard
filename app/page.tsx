import { Dashboard } from "@/components/dashboard";
import { listProjectsWithPaginationAndPreview } from "@/lib/projects";
import { ensureSchema } from "@/lib/schema";
import { ProjectsResponse } from "@/lib/types";

// Force dynamic rendering so project listings are always up-to-date
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  let initialData: ProjectsResponse | null = null;
  let initialLoaded = false;

  try {
    await ensureSchema();
    initialData = await listProjectsWithPaginationAndPreview(1, 6, 2);
    initialLoaded = true;
  } catch {
    initialData = null;
    initialLoaded = false;
  }

  return (
    <main className="shell">
      <Dashboard initialData={initialData} initialLoaded={initialLoaded} />
    </main>
  );
}