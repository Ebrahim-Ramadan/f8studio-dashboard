import { Dashboard } from "@/components/dashboard";
import { listProjectsWithPaginationAndPreview } from "@/lib/projects";
import { ensureSchema } from "@/lib/schema";
import { ProjectsResponse } from "@/lib/types";

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
      <section className="hero">
        <div className="hero-brand">
          {/* <p className="eyebrow">Architectural office</p> */}
          <img
            src="/logo.jpeg"
            alt="Architectural office logo"
            width="200"
            height="200"
            className="hero-logo"
          />
        </div>
        <img src="/OIP.png" alt="Architectural office logo" width="200" height="200" className="house3d" />
      </section>

      <Dashboard initialData={initialData} initialLoaded={initialLoaded} />
    </main>
  );
}