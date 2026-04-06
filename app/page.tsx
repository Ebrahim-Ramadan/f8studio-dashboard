import { Dashboard } from "@/components/dashboard";
import { listProjectsWithPreview } from "@/lib/projects";
import { ensureSchema } from "@/lib/schema";
import { ProjectRecord } from "@/lib/types";

export default async function Page() {
  let initialProjects: ProjectRecord[] = [];
  let initialLoaded = false;

  try {
    await ensureSchema();
    initialProjects = await listProjectsWithPreview(2);
    initialLoaded = true;
  } catch {
    initialProjects = [];
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

      <Dashboard initialProjects={initialProjects} initialLoaded={initialLoaded} />
    </main>
  );
}