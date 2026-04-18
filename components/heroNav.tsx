"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeroNav() {
  const pathname = usePathname() || "/";

  const isProjects = pathname === "/" || pathname.startsWith("/projects");
  const isSubmissions = pathname.startsWith("/submissions");
  const isCandidates = pathname.startsWith("/candidates");

  return (
    <div className="hero-brand">
      <div className="hero-logo-container">
        <img
          src="/logo.jpeg"
          alt="Architectural office logo"
          width={200}
          height={200}
          className="hero-logo"
        />

        <div className="logo-badges">
          <Link
            href="/"
            className={`logo-badge ${isProjects ? "active" : ""}`}
            aria-current={isProjects ? "page" : undefined}
            title="Projects"
            aria-label="Projects"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </Link>

          <Link
            href="/submissions"
            className={`logo-badge ${isSubmissions ? "active" : ""}`}
            aria-current={isSubmissions ? "page" : undefined}
            title="Submissions"
            aria-label="Submissions"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 7.5L12 13l9-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </Link>

          <Link
            href="/candidates"
            className={`logo-badge ${isCandidates ? "active" : ""}`}
            aria-current={isCandidates ? "page" : undefined}
            title="Candidates"
            aria-label="Candidates"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-3.3137 2.6863-6 6-6h4c3.3137 0 6 2.6863 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
