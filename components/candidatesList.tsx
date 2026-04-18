"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";
import {
  Table,
  TableElement,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";

type Candidate = {
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

type CandidatesResponse = {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function CandidatesList({ initialData }: { initialData: CandidatesResponse }) {
  const [data, setData] = useState<CandidatesResponse>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function loadPage(page: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates?page=${page}&pageSize=${data.pageSize}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load candidates");
      const json = (await res.json()) as CandidatesResponse;
      setData(json);
    } catch (e) {
      // noop for now
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>New candidates</h2>
        <div style={{ color: "#9cafcc" }}>{loading ? "Loading…" : `${data.total} total`}</div>
      </div>

      <Table>
        <TableElement>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Software</TableHead>
              <TableHead>Visualization</TableHead>
              <TableHead>AI Tools</TableHead>
              <TableHead>AI Usage</TableHead>
              <TableHead>Prompt Skill</TableHead>
              <TableHead>Design Style</TableHead>
              <TableHead>Contrast</TableHead>
              <TableHead>Design Tendency</TableHead>
              <TableHead>Design Focus</TableHead>
              <TableHead>Start Approach</TableHead>
              <TableHead>Problem Approach</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Under Pressure</TableHead>
              <TableHead>Work Env</TableHead>
              <TableHead>Scenario</TableHead>
              <TableHead>Portfolio Project</TableHead>
              <TableHead>Portfolio Why</TableHead>
              <TableHead>Final Filter</TableHead>
              <TableHead>Current Salary</TableHead>
              <TableHead>Expected Salary</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell style={{ fontWeight: 700 }}>{c.full_name}</TableCell>
                <TableCell style={{ minWidth: 260 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#cfe7ff", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</span>
                    <a
                      className="btn btn-ghost"
                      href={`mailto:${c.email}`}
                      style={{ padding: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Mail size={12} />
                    </a>
                  </div>
                </TableCell>
                <TableCell style={{ minWidth: 180 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#cfe7ff" }}>{c.phone ?? "—"}</span>
                    {c.phone ? (
                      <a
                        className="btn btn-ghost"
                        href={`tel:${c.phone}`}
                        style={{ padding: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Phone size={12} />
                      </a>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{c.main_field ?? "—"}</TableCell>
                <TableCell>{c.years_experience ?? "—"}</TableCell>
                <TableCell style={{ minWidth: 220 }}>{Array.isArray(c.software_skills) ? c.software_skills.join(", ") : "—"}</TableCell>
                <TableCell style={{ minWidth: 140 }}>{c.visualization_level ?? "—"}</TableCell>
                <TableCell style={{ minWidth: 220 }}>{Array.isArray(c.ai_tools) ? c.ai_tools.join(", ") : "—"}</TableCell>
                <TableCell style={{ minWidth: 220 }}>{Array.isArray(c.ai_usage) ? c.ai_usage.join(", ") : "—"}</TableCell>
                <TableCell>{c.prompt_skill ?? "—"}</TableCell>
                <TableCell>{c.design_style ?? "—"}</TableCell>
                <TableCell>{c.contrast_preference ?? "—"}</TableCell>
                <TableCell>{c.design_tendency ?? "—"}</TableCell>
                <TableCell>{c.design_focus ?? "—"}</TableCell>
                <TableCell>{c.start_approach ?? "—"}</TableCell>
                <TableCell style={{ minWidth: 300 }}>{Array.isArray(c.problem_approach) ? c.problem_approach.join(" | ") : "—"}</TableCell>
                <TableCell style={{ minWidth: 220 }}>{c.feedback_handling ?? "—"}</TableCell>
                <TableCell>{c.under_pressure ?? "—"}</TableCell>
                <TableCell>{c.work_environment ?? "—"}</TableCell>
                <TableCell>{c.scenario_response ?? "—"}</TableCell>
                <TableCell style={{ minWidth: 260 }}>{c.portfolio_project ?? "—"}</TableCell>
                <TableCell style={{ minWidth: 360 }}>{c.portfolio_why ?? "—"}</TableCell>
                <TableCell>{c.final_filter ?? "—"}</TableCell>
                <TableCell>{c.current_salary ?? "—"}</TableCell>
                <TableCell>{c.expected_salary ?? "—"}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </Table>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={() => loadPage(Math.max(1, data.page - 1))} disabled={data.page === 1}>
          <ChevronLeft size={14} />
        </button>
        <div style={{ alignSelf: "center", color: "#9cafcc" }}>
          Page <strong style={{ color: "#f2f6ff" }}>{data.page}</strong> of <strong>{data.totalPages}</strong>
        </div>
        <button className="btn btn-ghost" onClick={() => loadPage(Math.min(data.totalPages, data.page + 1))} disabled={data.page >= data.totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}
