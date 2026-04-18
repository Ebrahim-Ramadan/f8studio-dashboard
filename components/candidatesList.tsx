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
  const [submittedOrder, setSubmittedOrder] = useState<"desc" | "asc">("desc");
  const [yearsOption, setYearsOption] = useState<string>("any");
  const [currentSalarySort, setCurrentSalarySort] = useState<"none" | "asc" | "desc">("none");
  const [expectedSalarySort, setExpectedSalarySort] = useState<"none" | "asc" | "desc">("none");

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function loadPage(page: number, overrides?: {
    submittedOrder?: "asc" | "desc";
    yearsOption?: string;
    currentSalarySort?: "none" | "asc" | "desc";
    expectedSalarySort?: "none" | "asc" | "desc";
  }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(data.pageSize));
      const effectiveSubmittedOrder = overrides?.submittedOrder ?? submittedOrder;
      const effectiveYearsOption = overrides?.yearsOption ?? yearsOption;
      const effectiveCurrentSalarySort = overrides?.currentSalarySort ?? currentSalarySort;
      const effectiveExpectedSalarySort = overrides?.expectedSalarySort ?? expectedSalarySort;

      if (effectiveSubmittedOrder) params.set("submitted_order", effectiveSubmittedOrder);

      // map yearsOption to min/max years
      if (effectiveYearsOption && effectiveYearsOption !== "any") {
        if (effectiveYearsOption.startsWith("lt")) {
          const n = Number(effectiveYearsOption.replace("lt", ""));
          // '<N' -> maxYears = N - 1
          params.set("max_years", String(Math.max(0, n - 1)));
        } else if (effectiveYearsOption.startsWith("gte")) {
          const n = Number(effectiveYearsOption.replace("gte", ""));
          params.set("min_years", String(n));
        }
      }

      const res = await fetch(`/api/candidates?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load candidates");
      let json = (await res.json()) as CandidatesResponse;

      // Apply client-side salary sorting if requested
      function parseSalary(s: string | null) {
        if (!s) return NaN;
        const num = Number(String(s).replace(/[^0-9.\-]/g, ""));
        return Number.isFinite(num) ? num : NaN;
      }

      if (effectiveExpectedSalarySort !== "none") {
        json.candidates = [...json.candidates].sort((a, b) => {
          const av = parseSalary(a.expected_salary ?? null);
          const bv = parseSalary(b.expected_salary ?? null);
          if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
          if (Number.isNaN(av)) return 1;
          if (Number.isNaN(bv)) return -1;
          return effectiveExpectedSalarySort === "asc" ? av - bv : bv - av;
        });
      }

      if (effectiveCurrentSalarySort !== "none") {
        json.candidates = [...json.candidates].sort((a, b) => {
          const av = parseSalary(a.current_salary ?? null);
          const bv = parseSalary(b.current_salary ?? null);
          if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
          if (Number.isNaN(av)) return 1;
          if (Number.isNaN(bv)) return -1;
          return effectiveCurrentSalarySort === "asc" ? av - bv : bv - av;
        });
      }

      setData(json);
    } catch (e) {
      // noop for now
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    void loadPage(1);
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>New candidates</h2>
        <div style={{ color: "#9cafcc" }}>{loading ? "Loading…" : `${data.total} total`}</div>
      </div>

      {/* Combined filter select (right-aligned) */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#9cafcc", fontSize: "0.9rem" }}>{loading ? "Applying…" : `${data.total} total`}</div>

        <select
          aria-label="Quick filters"
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v === "clear") {
              setSubmittedOrder("desc");
              setYearsOption("any");
              setCurrentSalarySort("none");
              setExpectedSalarySort("none");
              void loadPage(1, { submittedOrder: "desc", yearsOption: "any", currentSalarySort: "none", expectedSalarySort: "none" });
              return;
            }

            const [type, val] = v.split(":");

            if (type === "submitted") {
              const order = val === "asc" ? "asc" : "desc";
              setSubmittedOrder(order);
              void loadPage(1, { submittedOrder: order });
              return;
            }

            if (type === "years") {
              setYearsOption(val);
              void loadPage(1, { yearsOption: val });
              return;
            }

            if (type === "curSalary") {
              setCurrentSalarySort(val === "asc" ? "asc" : "desc");
              void loadPage(1, { currentSalarySort: val as any });
              return;
            }

            if (type === "expSalary") {
              setExpectedSalarySort(val === "asc" ? "asc" : "desc");
              void loadPage(1, { expectedSalarySort: val as any });
              return;
            }
          }}
          defaultValue=""
          style={{ marginLeft: "auto", minWidth: 220, padding: "8px 10px", borderRadius: 10, background: "rgb(70, 79, 83)", color: "white", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <option value="">Quick filters — select...</option>
          <optgroup label="Submitted">
            <option value="submitted:desc">Recent → Old</option>
            <option value="submitted:asc">Old → Recent</option>
          </optgroup>
          <optgroup label="Years of experience">
            <option value="years:lt1">&lt;1</option>
            <option value="years:lt2">&lt;2</option>
            <option value="years:lt3">&lt;3</option>
            <option value="years:lt4">&lt;4</option>
            <option value="years:lt5">&lt;5</option>
            <option value="years:gte5">≥5</option>
          </optgroup>
          <optgroup label="Current salary">
            <option value="curSalary:desc">Large → Small</option>
            <option value="curSalary:asc">Small → Large</option>
          </optgroup>
          <optgroup label="Expected salary">
            <option value="expSalary:desc">Large → Small</option>
            <option value="expSalary:asc">Small → Large</option>
          </optgroup>
          <optgroup label="Actions">
            <option value="clear">Reset filters</option>
          </optgroup>
        </select>
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
