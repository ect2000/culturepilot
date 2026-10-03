import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main" className="page-container missing-analysis">
      <Brand />
      <p className="eyebrow">404 / UNCHARTED TERRITORY</p>
      <h1>This connection leads somewhere else.</h1>
      <p>Open the studio to start a new cultural investigation.</p>
      <Button asChild>
        <Link href="/brief">Back to the studio</Link>
      </Button>
    </main>
  );
}
