import { Dashboard } from "@/components/dashboard";

export default function Page() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Architectural office</p>
          {/* <h1>Project admin dashboard</h1> */}
          <img  src="/logo.jpeg" alt="logo" width="200" height="200" className="rounded-full" />
        </div>
        <div className="hero-card">
          <span>Built for the team</span>
          <strong>Project admin dashboard</strong>
          <p>Fast editing, easy updates, and no extra login setup needed.</p>
        </div>
      </section>

      <Dashboard />
    </main>
  );
}