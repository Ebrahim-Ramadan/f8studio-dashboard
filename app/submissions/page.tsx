import { Submissions } from "@/components/submissions";
import { listSubmissions } from "@/lib/submissions";
import { ensureSchema } from "@/lib/schema";
import { SubmissionsResponse } from "@/lib/types";

export default async function SubmissionsPage() {
  let initialData: SubmissionsResponse | null = null;
  let initialLoaded = false;

  try {
    await ensureSchema();
    initialData = await listSubmissions(1, 10);
    initialLoaded = true;
  } catch {
    initialData = null;
    initialLoaded = false;
  }

  return (
    <Submissions
      initialData={initialData}
      initialLoaded={initialLoaded}
    />
  );
}
