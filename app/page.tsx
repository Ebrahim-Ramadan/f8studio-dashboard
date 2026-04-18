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
        <nav className="hero-nav" aria-label="Quick links">
          <a href="/submissions" className="nav-icon" aria-label="Submissions">Submissions</a>
          {/* <a href="/projects" className="nav-icon" aria-label="Projects">📐</a>
          <a href="/contact" className="nav-icon" aria-label="Contact">✉️</a>
          <a href="/about" className="nav-icon" aria-label="About">ℹ️</a> */}
        </nav>
      </section>

      <Dashboard initialData={initialData} initialLoaded={initialLoaded} />
    </main>
  );
}