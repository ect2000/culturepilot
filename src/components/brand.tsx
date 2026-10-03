import Link from "next/link";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="CulturePilot home">
      <svg
        viewBox="0 0 32 32"
        width="31"
        height="31"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 3 28 10v12L16 29 4 22V10L16 3Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="m16 8 7 4v8l-7 4-7-4v-8l7-4Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="m16 8 0 16M9 12l14 8M23 12 9 20"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="16" cy="16" r="3" fill="currentColor" />
      </svg>
      {!compact && (
        <span>
          Culture<span className="brand-light">Pilot</span>
          <span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
