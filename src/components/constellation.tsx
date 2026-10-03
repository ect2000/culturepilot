const points = Array.from({ length: 85 }, (_, i) => ({
  x: 70 + ((i * 137.51) % 630),
  y: 55 + ((i * 83.27) % 510),
  r: i % 9 === 0 ? 2 : 1,
}));
export function Constellation({ small = false }: { small?: boolean }) {
  const nodes = [
    { x: 195, y: 130, label: "BRANDS", sub: "Identity & belonging" },
    { x: 587, y: 176, label: "MUSIC", sub: "Sound & expression" },
    { x: 615, y: 420, label: "PLACES", sub: "Rituals & experiences" },
    { x: 190, y: 477, label: "FILM", sub: "Stories & aesthetics" },
    { x: 78, y: 315, label: "BOOKS", sub: "Ideas & perspectives" },
  ];
  return (
    <div
      className={`constellation ${small ? "constellation-small" : ""}`}
      aria-label="Decorative illustration of an audience connected to research categories"
    >
      <svg viewBox="0 0 780 620" role="img">
        <title>From audience to cultural connections</title>
        <defs>
          <radialGradient id="orbit-glow">
            <stop stopColor="#b98656" stopOpacity=".12" />
            <stop offset="1" stopColor="#b98656" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edge-glow">
            <stop stopColor="#d4a57c" stopOpacity=".5" />
            <stop offset="1" stopColor="#d4a57c" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <circle cx="385" cy="310" r="280" fill="url(#orbit-glow)" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="#b7ada0"
            opacity={i % 3 === 0 ? 0.35 : 0.16}
          />
        ))}
        {[110, 185, 260].map((r) => (
          <circle
            key={r}
            cx="385"
            cy="310"
            r={r}
            fill="none"
            stroke="#d4a57c"
            strokeOpacity=".09"
          />
        ))}
        <circle
          className="orbit"
          cx="385"
          cy="310"
          r="185"
          fill="none"
          stroke="#d4a57c"
          strokeOpacity=".32"
          strokeDasharray="1 27"
        />
        {nodes.map((n, i) => (
          <g key={n.label}>
            <path
              className="constellation-edge"
              style={{ animationDelay: `${i * 0.2}s` }}
              d={`M385 310 Q${n.x + 60} ${n.y - 40} ${n.x} ${n.y}`}
              fill="none"
              stroke="url(#edge-glow)"
            />
            <circle cx={n.x} cy={n.y} r="5" fill="#c79970" />
            <circle
              cx={n.x}
              cy={n.y}
              r="11"
              fill="none"
              stroke="#c79970"
              strokeOpacity=".25"
            />
            <text
              x={n.x + 19}
              y={n.y - 2}
              fill="#d0c6b9"
              fontSize="11"
              letterSpacing="2"
            >
              {n.label}
            </text>
            <text x={n.x + 19} y={n.y + 16} fill="#827d75" fontSize="10">
              {n.sub}
            </text>
          </g>
        ))}
        <circle
          cx="385"
          cy="310"
          r="65"
          fill="#141613"
          stroke="#c79970"
          strokeOpacity=".5"
        />
        <circle
          cx="385"
          cy="310"
          r="74"
          fill="none"
          stroke="#c79970"
          strokeOpacity=".12"
        />
        <path
          d="M369 285h32l-16 16-16-16Zm0 50h32l-16-16-16 16Z"
          fill="#d4a57c"
          opacity=".8"
        />
        <text
          x="385"
          y="313"
          textAnchor="middle"
          fontSize="10"
          fill="#e4d9ca"
          letterSpacing="2"
        >
          AUDIENCE
        </text>
        <circle cx="543" cy="493" r="3" fill="#d4a57c" />
        <path d="M543 493 690 530" stroke="#d4a57c" strokeOpacity=".3" />
        <text x="589" y="550" fill="#857b6c" fontSize="9" letterSpacing="2">
          A WORLD OF CONNECTIONS
        </text>
      </svg>
      <span className="constellation-caption">
        <span className="status-dot" /> CULTURAL RESEARCH DIMENSIONS
      </span>
    </div>
  );
}
