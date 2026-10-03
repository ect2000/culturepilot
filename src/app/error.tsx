"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-container missing-analysis">
      <p className="eyebrow">SOMETHING INTERRUPTED THE STUDIO</p>
      <h1>Let’s reopen your workspace.</h1>
      <p>Your completed local reports can still be found in recent analyses.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
