/**
 * REMONTADA SPORTSWEAR — primary mark.
 * Hand-authored low-poly ibex (mountain goat) rearing on its hind legs,
 * geometric horns, neon-blue facets, glow + drifting particles + floor reflection.
 * Pure SVG — scales from 16px favicon to hero plate.
 */

type MarkProps = {
  size?: number;
  glow?: boolean;
  className?: string;
  idPrefix?: string;
};

// facet fills — light on the back, deep in the shadow
const F = {
  light: "#A8ECFF",
  hi: "#5FD9FF",
  mid: "#35C8FF",
  base: "#0A84FF",
  deep: "#0B4F9E",
  dark: "#08305E",
  hot: "#00B4FF",
};

export function IbexMark({
  size = 48,
  glow = true,
  className = "",
  idPrefix = "mk",
}: MarkProps) {
  const g = `${idPrefix}-g`;
  const glowId = `${idPrefix}-glow`;
  return (
    <svg
      width={size}
      height={size * (300 / 240)}
      viewBox="0 0 240 300"
      className={className}
      role="img"
      aria-label="شعار REMONTADA"
      fill="none"
    >
      <defs>
        <linearGradient id={g} x1="1" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor={F.light} />
          <stop offset="0.42" stopColor={F.mid} />
          <stop offset="1" stopColor={F.deep} />
        </linearGradient>
        <linearGradient id={`${g}-d`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={F.base} />
          <stop offset="1" stopColor={F.dark} />
        </linearGradient>
        <linearGradient id={`${g}-h`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={F.hi} />
          <stop offset="1" stopColor={F.base} />
        </linearGradient>
        <linearGradient id={`${g}-refl`} x1="0" y1="222" x2="0" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${idPrefix}-mask`}>
          <rect x="0" y="222" width="240" height="78" fill={`url(#${g}-refl)`} />
        </mask>
        {glow && (
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? `url(#${glowId})` : undefined}>
        {/* ---- reflection on the wet floor ---- */}
        <g mask={`url(#${idPrefix}-mask)`} transform="matrix(1 0 0 -1 0 444)" opacity="0.55">
          <IbexBody g={g} />
        </g>

        {/* ---- floor line ---- */}
        <rect x="28" y="221" width="184" height="1.6" fill={`url(#${g})`} opacity="0.85" />

        <IbexBody g={g} />

        {/* ---- ambient particles ---- */}
        <g fill={F.hi}>
          <circle className="p" cx="54" cy="176" r="2.1" style={{ animationDelay: "0s" }} />
          <circle className="p" cx="196" cy="150" r="1.7" style={{ animationDelay: "1.1s" }} />
          <circle className="p" cx="86" cy="118" r="1.4" style={{ animationDelay: "2.4s" }} />
          <circle className="p" cx="216" cy="196" r="1.9" style={{ animationDelay: "3.2s" }} />
          <circle className="p" cx="40" cy="96" r="1.5" style={{ animationDelay: "4.1s" }} />
          <circle className="p" cx="164" cy="46" r="1.6" style={{ animationDelay: "0.7s" }} />
        </g>
      </g>
    </svg>
  );
}

function IbexBody({ g }: { g: string }) {
  return (
    <g>
      {/* ---- swept geometric horns ---- */}
      <polygon
        points="198,54 186,40 168,28 150,22 144,26 152,34 166,38 182,50 192,64"
        fill={`url(#${g}-h)`}
      />
      <polygon points="168,28 160,32 166,38 174,34" fill={F.deep} opacity="0.75" />
      <polygon points="186,40 178,45 182,50 190,46" fill={F.deep} opacity="0.75" />
      <polygon
        points="203,62 195,47 180,35 165,30 161,36 175,43 189,55 199,70"
        fill={`url(#${g}-d)`}
      />

      {/* ---- head ---- */}
      <polygon points="194,56 212,46 223,53 213,63 197,71 187,63" fill={`url(#${g})`} />
      <polygon points="197,71 213,63 206,74 192,75" fill={`url(#${g}-d)`} />
      <polygon points="204,55 210,53 211,60 205,60" fill="#FFFFFF" opacity="0.92" />
      <polygon points="217,50 223,53 219,57 215,54" fill={F.dark} opacity="0.7" />

      {/* ---- neck ---- */}
      <polygon points="156,98 180,76 194,56 197,71 178,92 166,114" fill={`url(#${g})`} />
      <polygon points="178,92 197,71 192,84 176,102" fill={`url(#${g}-d)`} opacity="0.85" />

      {/* ---- torso ---- */}
      <polygon points="98,126 128,112 156,98 153,127 124,137 104,140" fill={`url(#${g})`} />
      <polygon points="104,140 124,137 153,127 168,118 150,146 122,158 102,152" fill={`url(#${g}-d)`} />
      <polygon points="153,127 168,118 156,146 144,134" fill={`url(#${g}-h)`} opacity="0.9" />
      <polygon points="98,126 104,140 102,152 92,142" fill={`url(#${g}-d)`} />

      {/* ---- tail ---- */}
      <polygon points="98,124 84,114 78,122 92,134" fill={`url(#${g}-d)`} />

      {/* ---- fore legs (tucked, rearing) ---- */}
      <polygon points="158,124 176,132 186,150 178,158 168,144 152,136" fill={`url(#${g}-d)`} />
      <polygon points="178,158 186,150 174,168 164,182 158,176 166,162" fill={`url(#${g}-d)`} />
      <polygon points="164,114 182,120 196,134 188,142 174,130 158,126" fill={`url(#${g})`} />
      <polygon points="188,142 196,134 186,152 176,168 168,164 176,148" fill={`url(#${g}-h)`} />
      <polygon points="176,168 186,152 182,172 172,176" fill={F.deep} opacity="0.8" />

      {/* ---- hind legs (extended to the floor) ---- */}
      <polygon points="102,140 124,148 122,178 104,180 96,158" fill={`url(#${g}-d)`} />
      <polygon points="104,178 122,178 116,204 108,218 100,218 100,196" fill={`url(#${g}-d)`} />
      <polygon points="98,214 110,214 112,222 96,222" fill={F.deep} />

      <polygon points="112,146 134,152 132,180 116,182 108,162" fill={`url(#${g})`} />
      <polygon points="116,180 132,180 130,204 126,218 118,218 120,198" fill={`url(#${g})`} />
      <polygon points="118,214 132,214 134,222 116,222" fill={F.mid} />
      <polygon points="122,150 132,153 130,176 120,174" fill={F.hot} opacity="0.55" />
    </g>
  );
}

/** Wordmark lockup — used in the sticky header and footer */
export function Wordmark({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <IbexMark size={compact ? 26 : 34} idPrefix={compact ? "hd" : "ft"} />
      <span className="flex flex-col leading-none">
        <span
          className="tech font-bold tracking-[0.06em] text-paper"
          style={{ fontSize: compact ? "1.02rem" : "1.3rem" }}
        >
          REMONTADA
        </span>
        <span
          className="tech text-neon/85"
          style={{
            fontSize: compact ? "0.5rem" : "0.6rem",
            letterSpacing: "0.44em",
            fontWeight: 600,
          }}
        >
          SPORTSWEAR
        </span>
      </span>
    </span>
  );
}

/** Full logo plate — the neon presentation lockup (About + hero badge) */
export function LogoPlate({ scale = 1 }: { scale?: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-hair bg-[#05050F] grain">
      {/* diagonal light streaks */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-0 h-full w-24 -skew-x-[24deg] bg-gradient-to-b from-transparent via-neon/25 to-transparent" />
        <div className="absolute left-1/3 top-0 h-full w-10 -skew-x-[24deg] bg-gradient-to-b from-transparent via-neon/10 to-transparent" />
        <div className="absolute -right-8 top-0 h-full w-16 -skew-x-[24deg] bg-gradient-to-b from-transparent via-flame/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-neon/10 to-transparent" />
      </div>

      <div
        className="relative flex flex-col items-center justify-center px-6 py-12"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute h-56 w-56 rounded-full bg-neon/12 blur-[70px]" />
        <IbexMark size={150} idPrefix="plate" />
        <div className="mt-6 text-center">
          <div
            className="tech font-bold text-neon glow-neon"
            style={{ fontSize: "clamp(1.9rem,7vw,3.4rem)", letterSpacing: "0.05em" }}
          >
            REMONTADA
          </div>
          <div
            className="tech mt-1 text-[#9BE4FF] glow-neon"
            style={{
              fontSize: "clamp(0.6rem,2vw,0.86rem)",
              letterSpacing: "0.62em",
              fontWeight: 600,
            }}
          >
            SPORTSWEAR
          </div>
        </div>
      </div>
    </div>
  );
}
