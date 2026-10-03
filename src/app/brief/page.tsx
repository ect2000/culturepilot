import { Suspense } from "react";
import { StudioShell } from "@/components/studio-shell";
import { BriefBuilder } from "@/components/brief-builder";
export default function BriefPage() {
  return (
    <StudioShell>
      <Suspense
        fallback={
          <div className="page-container skeleton-shell">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-panel" />
          </div>
        }
      >
        <BriefBuilder />
      </Suspense>
    </StudioShell>
  );
}
