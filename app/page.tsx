import { Dashboard } from "@/components/dashboard";

export default function Page() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-brand">
          <p className="eyebrow">Architectural office</p>
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

      <Dashboard />
    </main>
  );
}