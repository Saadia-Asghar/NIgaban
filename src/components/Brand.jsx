/**
 * Aurora brand mark for NIgaban.
 * A shield wrapped around a stylised "N" with an aurora gradient.
 *
 *   <NigabanLogo size={36} />        — shield + glyph
 *   <NigabanWordmark />              — shield + glyph + wordmark
 */

const GRADIENT_ID = "nigaban-aurora";

function AuroraGradientDefs() {
  return (
    <defs>
      <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#6366f1" />
        <stop offset="50%"  stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id={`${GRADIENT_ID}-soft`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stopColor="rgba(255,255,255,0.18)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
  );
}

export function NigabanLogo({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="NIgaban logo"
      className={className}
    >
      <AuroraGradientDefs />
      {/* Shield silhouette */}
      <path
        d="M24 3.5 4.5 9.8v12.7c0 11.5 8.1 20.7 19.5 22 11.4-1.3 19.5-10.5 19.5-22V9.8L24 3.5Z"
        fill={`url(#${GRADIENT_ID})`}
      />
      <path
        d="M24 3.5 4.5 9.8v12.7c0 11.5 8.1 20.7 19.5 22 11.4-1.3 19.5-10.5 19.5-22V9.8L24 3.5Z"
        fill={`url(#${GRADIENT_ID}-soft)`}
      />
      {/* Inner border */}
      <path
        d="M24 7 8 12.2v10.3c0 9.4 6.6 16.9 16 18 9.4-1.1 16-8.6 16-18V12.2L24 7Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />
      {/* "N" stroke — bold, slightly tilted */}
      <path
        d="M16.5 32V16h3.4l8.2 10.3V16h3.4v16h-3.4l-8.2-10.3V32h-3.4Z"
        fill="white"
        opacity="0.97"
      />
    </svg>
  );
}

export function NigabanWordmark({ size = 32, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NigabanLogo size={size} className="logo-glow" />
      <div className="flex flex-col leading-none">
        <span className="font-black text-[15px] tracking-tight text-white">
          NI<span className="aurora-text">gaban</span>
        </span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold mt-0.5">
          AI Safety
        </span>
      </div>
    </div>
  );
}

export default NigabanLogo;
