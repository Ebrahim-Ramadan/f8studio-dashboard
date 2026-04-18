import CandidatesList from "@/components/candidatesList";
import { listCandidatesWithPagination, type CandidatesResponse } from "@/lib/hiringCandidates";

export const revalidate = 0; // ensure no ISR

export default async function Page() {
  const page = 1;
  const pageSize = 10;

  // Server-side: call DB helper directly to avoid using a relative URL in fetch
  const initialData = (await listCandidatesWithPagination(page, pageSize)) as CandidatesResponse;

  return (
    <main className="page-root">
      <div style={{ maxWidth: 1100, margin: "24px auto" }}>
        {/* Server-rendered initial list (RSC) with cache disabled */}
        {/* Hydrates client component for pagination */}
        <CandidatesList initialData={initialData} />
      </div>
    </main>
  );
}
