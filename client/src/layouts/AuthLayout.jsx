import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

/* ── Animated code tokens (visual only) ──────────────── */
const CODE_LINES = [
  [
    { t: 'import', c: 'text-violet-400' },
    { t: ' { ', c: 'text-surface-300' },
    { t: 'SyncSpace', c: 'text-sky-300' },
    { t: ' } ', c: 'text-surface-300' },
    { t: 'from', c: 'text-violet-400' },
    { t: " 'syncspace'", c: 'text-emerald-300' },
    { t: ';', c: 'text-surface-500' },
  ],
  [
    { t: 'const', c: 'text-violet-400' },
    { t: ' room = ', c: 'text-surface-300' },
    { t: 'await', c: 'text-violet-400' },
    { t: ' SyncSpace', c: 'text-yellow-300' },
    { t: '.', c: 'text-surface-300' },
    { t: 'open', c: 'text-sky-300' },
    { t: '({ ', c: 'text-surface-400' },
    { t: 'team', c: 'text-orange-300' },
    { t: ' })', c: 'text-surface-400' },
    { t: ';', c: 'text-surface-500' },
  ],
  [
    { t: '// canvas + editor, synchronized', c: 'text-surface-600' },
  ],
  [
    { t: 'room', c: 'text-surface-300' },
    { t: '.', c: 'text-surface-300' },
    { t: 'connect', c: 'text-sky-300' },
    { t: '()', c: 'text-surface-400' },
    { t: ';', c: 'text-surface-500' },
  ],
];

const FLAT = CODE_LINES.map((tokens) => {
  const chars = [];
  tokens.forEach((tok) => {
    for (const ch of tok.t) chars.push({ ch, c: tok.c });
  });
  return chars;
});

const TOTAL_CHARS = FLAT.reduce((n, line) => n + line.length, 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Feature list (moved to constant for hover state) ─ */
const FEATURES = [
  { icon: '🎨', title: 'Collaborative Whiteboard', desc: 'Draw and sketch with your team simultaneously' },
  { icon: '💻', title: 'Live Code Editor', desc: 'Write code together with Monaco Editor + Yjs CRDT' },
  { icon: '⚡', title: 'Real-Time Sync', desc: 'Zero-latency sync powered by Socket.io + Yjs' },
];

export default function AuthLayout() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        setLineIdx(0);
        setCharIdx(0);
        setDone(false);
        await sleep(700);
        if (cancelled) return;

        for (let li = 0; li < FLAT.length; li++) {
          setLineIdx(li);
          setCharIdx(0);
          for (let ci = 1; ci <= FLAT[li].length; ci++) {
            if (cancelled) return;
            setCharIdx(ci);
            await sleep(35 + Math.random() * 35);
          }
          if (cancelled) return;
          await sleep(320);
        }
        setDone(true);
        await sleep(2600);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleForLine = (li) => {
    if (li < lineIdx) return FLAT[li].length;
    if (li === lineIdx) return charIdx;
    return 0;
  };

  const typedCount =
    FLAT.slice(0, lineIdx).reduce((n, l) => n + l.length, 0) + charIdx;
  const progress = Math.round((typedCount / TOTAL_CHARS) * 100);

  return (
    <div
      className="relative flex min-h-screen w-full overflow-x-hidden lg:h-screen lg:overflow-hidden"
      style={{ backgroundColor: 'rgb(var(--surface-950))', color: 'rgb(var(--text-base))' }}
    >
      {/* ── Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes ss-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes ss-scan {
          0% { transform: translateY(-120%); opacity: 0; }
          30% { opacity: 0.7; }
          100% { transform: translateY(520%); opacity: 0; }
        }
        @keyframes ss-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
        @keyframes ss-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ss-collab-in {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ss-feature-bounce {
          0%, 100% { transform: translateY(0) scale(1.08) rotate(0deg); }
          40% { transform: translateY(-3px) scale(1.12) rotate(-4deg); }
          70% { transform: translateY(-1px) scale(1.10) rotate(3deg); }
        }
        @keyframes ss-feature-shine {
          0% { transform: translateX(-120%); opacity: 0; }
          40% { opacity: 0.6; }
          100% { transform: translateX(220%); opacity: 0; }
        }
        @keyframes ss-glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes ss-arrow-slide {
          0%, 100% { transform: translateX(0); opacity: 0.35; }
          50% { transform: translateX(3px); opacity: 0.9; }
        }
        .ss-cursor {
          display: inline-block;
          width: 6px;
          height: 13px;
          background: rgba(129,140,248,0.98);
          vertical-align: -2px;
          margin-left: 1px;
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(129,140,248,0.7);
          animation: ss-blink 1s steps(1, end) infinite;
        }
        .ss-scanline { animation: ss-scan 7s ease-in-out infinite; }
        .ss-orbit-slow { animation: ss-orbit 24s linear infinite; }
        .ss-collab { animation: ss-collab-in 0.6s ease-out 0.2s both; }

        /* Feature hover animations */
        .ss-feature-row { transition: background-color 200ms ease, transform 200ms ease; }
        .ss-feature-row:hover { background-color: rgba(255,255,255,0.018); }
        .ss-feature-row .ss-feature-icon { transition: transform 220ms cubic-bezier(.34,1.56,.64,1), border-color 220ms ease, box-shadow 220ms ease; }
        .ss-feature-row:hover .ss-feature-icon {
          animation: ss-feature-bounce 620ms cubic-bezier(.34,1.56,.64,1);
          border-color: rgba(129,140,248,0.35);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.06) inset,
            0 0 0 1px rgba(129,140,248,0.10),
            0 8px 20px -10px rgba(99,102,241,0.65);
        }
        .ss-feature-row .ss-feature-title { transition: color 200ms ease, letter-spacing 200ms ease; }
        .ss-feature-row:hover .ss-feature-title { color: #e5e7eb; }
        .ss-feature-row .ss-feature-desc { transition: color 200ms ease; }
        .ss-feature-row:hover .ss-feature-desc { color: rgb(148,163,184); }
        .ss-feature-row .ss-feature-arrow { transition: opacity 200ms ease; }
        .ss-feature-row:hover .ss-feature-arrow { animation: ss-arrow-slide 1.2s ease-in-out infinite; }
        .ss-feature-row .ss-feature-glow { opacity: 0; transition: opacity 260ms ease; }
        .ss-feature-row:hover .ss-feature-glow {
          opacity: 1;
          animation: ss-glow-pulse 2.2s ease-in-out infinite;
        }
        .ss-feature-row .ss-feature-shine { opacity: 0; }
        .ss-feature-row:hover .ss-feature-shine { animation: ss-feature-shine 900ms ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .ss-cursor, .ss-scanline, .ss-orbit-slow, .ss-collab,
          .ss-feature-row:hover .ss-feature-icon,
          .ss-feature-row:hover .ss-feature-arrow,
          .ss-feature-row:hover .ss-feature-glow,
          .ss-feature-row:hover .ss-feature-shine {
            animation: none !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          LEFT — Developer showcase (desktop / lg+)
      ══════════════════════════════════════════════════════ */}
      <aside
        className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] 2xl:w-[42%] max-w-[680px] flex-col overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Layer 0: base gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #0a0c12 0%, #06080d 55%, #04060a 100%)',
          }}
        />

        {/* Layer 1: primary orb + orbit dot */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.20) 0%, rgba(99,102,241,0.05) 32%, transparent 62%)',
              filter: 'blur(60px)',
            }}
          />
          <div className="ss-orbit-slow absolute -left-40 -top-40 h-[640px] w-[640px]">
            <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-400/70 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
          </div>
        </div>

        {/* Layer 2: bottom-right counter glow */}
        <div
          className="pointer-events-none absolute -bottom-48 -right-32 h-[520px] w-[520px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(129,140,248,0.09) 0%, transparent 60%)',
            filter: 'blur(70px)',
          }}
        />

        {/* Layer 3: code grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.018,
            maskImage:
              'radial-gradient(ellipse 70% 60% at 30% 30%, black 20%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 30% 30%, black 20%, transparent 78%)',
          }}
        />

        {/* Layer 4: right edge hairline */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.22) 22%, rgba(99,102,241,0.05) 60%, transparent 100%)',
          }}
        />

        {/* Layer 5: top edge hairline */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          }}
        />

        {/* ── Content ─────────────────────────────────────── */}
        <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-10 py-8 xl:px-12 xl:py-9 2xl:px-14 2xl:py-10">

          {/* Top bar */}
          <div className="flex flex-shrink-0 items-center justify-between gap-4">
            <Link
              to="/"
              className="group inline-flex w-fit items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06080d]"
            >
              <div className="relative flex h-[32px] w-[38px] flex-shrink-0 items-center justify-center transition-transform duration-200 ease-out group-hover:scale-[1.05]">
                <img src="/syncspace-logo.png" alt="SyncSpace" className="h-full w-full object-contain" />
              </div>

              <span
                className="text-[14.5px] font-semibold tracking-[-0.015em]"
                style={{ color: 'rgb(var(--text-base))' }}
              >
                SyncSpace
              </span>
            </Link>

            <div
              className="hidden xl:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/80" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              <span className="font-mono text-[10px] font-medium tracking-tight text-surface-400">
                main
              </span>
            </div>
          </div>

          {/* Middle */}
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 max-w-[500px]">

            {/* Eyebrow */}
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full pl-2 pr-3 py-[5px]"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 0 0 rgba(255,255,255,0.03) inset',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-400" />
              </span>
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                {'// real-time'}
              </span>
            </div>

            {/* Headline */}
            <div>
              <h2
                className="text-[32px] xl:text-[38px] 2xl:text-[42px] font-semibold leading-[1.05] tracking-[-0.032em]"
                style={{ color: 'rgb(var(--text-base))' }}
              >
                Collaborate in
                <br />
                <span className="text-gradient">Real-Time</span>
              </h2>

              <p
                className="mt-4 max-w-[440px] text-[13.5px] leading-[1.65] tracking-[-0.005em]"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Draw, code, and create together. SyncSpace brings your team into one shared canvas and editor — live.
              </p>
            </div>

            {/* ── LIVE TYPING CODE WINDOW ─────────────────── */}
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                background:
                  'linear-gradient(180deg, rgba(13,16,24,0.96) 0%, rgba(8,10,16,0.96) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow:
                  '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.05)',
              }}
            >
              <div
                className="ss-scanline pointer-events-none absolute inset-x-0 top-0 z-20 h-12"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(129,140,248,0.07) 50%, transparent 100%)',
                }}
              />

              {/* Window chrome */}
              <div
                className="relative flex items-center justify-between gap-3 px-3.5 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.045)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/85" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/85" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/85" />
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400/80" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span className="font-mono text-[10px] font-medium tracking-tight text-surface-400">
                      collaboration.ts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-primary-400'}`}
                    style={{ animation: 'ss-pulse-dot 1.8s ease-in-out infinite' }}
                  />
                  <span
                    className={`font-mono text-[10px] font-medium tracking-tight ${
                      done ? 'text-emerald-400/80' : 'text-primary-400/90'
                    }`}
                  >
                    {done ? 'live' : 'typing'}
                  </span>
                </div>
              </div>

              {/* Code body */}
              <div className="relative px-4 py-3.5 font-mono text-[11.5px] leading-[1.75]">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 select-none text-right tabular-nums">
                    {FLAT.map((_, i) => {
                      const isCurrent = i === lineIdx && !done;
                      const isPast = i < lineIdx;
                      const cls = isCurrent ? 'text-primary-400' : isPast ? 'text-surface-600' : 'text-surface-700';
                      return (
                        <div key={i} className={`transition-colors duration-150 ${cls}`}>
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative min-w-0 flex-1 overflow-hidden">
                    {FLAT.map((line, li) => {
                      const visible = visibleForLine(li);
                      const shown = line.slice(0, visible);
                      const isActive = li === lineIdx && !done;

                      return (
                        <div key={li} className="relative whitespace-pre" style={{ minHeight: '1.75em' }}>
                          {shown.map((c, ci) => (
                            <span key={ci} className={c.c}>{c.ch}</span>
                          ))}
                          {isActive && <span className="ss-cursor" />}
                        </div>
                      );
                    })}

                    {done && (
                      <div
                        className="ss-collab pointer-events-none absolute"
                        style={{ top: '1.75em', left: '7.5em' }}
                      >
                        <div className="flex items-start gap-1">
                          <span
                            className="block h-[13px] w-[2px] rounded-sm"
                            style={{
                              background: 'rgb(52,211,153)',
                              boxShadow: '0 0 8px rgba(52,211,153,0.8)',
                            }}
                          />
                          <span
                            className="rounded-sm px-1.5 py-px text-[9px] font-semibold tracking-tight text-white"
                            style={{ background: 'rgb(16,185,129)' }}
                          >
                           Sync
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div
                className="flex items-center justify-between gap-3 px-3.5 py-1.5"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.045)',
                  background: 'rgba(99,102,241,0.035)',
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-primary-400'}`}
                      style={{ animation: 'ss-pulse-dot 2s ease-in-out infinite' }}
                    />
                    <span
                      className={`font-mono text-[9.5px] font-medium tracking-tight ${
                        done ? 'text-emerald-400/90' : 'text-primary-400/90'
                      }`}
                    >
                      {done ? 'Synced' : `Typing ${progress}%`}
                    </span>
                  </div>
                  <span className="truncate font-mono text-[9.5px] font-medium tracking-tight text-surface-600">
                    TypeScript · Yjs CRDT
                  </span>
                </div>
                <span className="font-mono text-[9.5px] font-medium tracking-tight text-surface-600">
                  UTF-8
                </span>
              </div>
            </div>

            {/* ── FEATURE ROWS with hover animation ──────── */}
            <div className="flex flex-col">
              {FEATURES.map((f, i) => (
                <div key={f.title}>
                  <div className="ss-feature-row group relative flex cursor-default items-start gap-3 overflow-hidden rounded-lg px-2 py-2.5">

                    {/* Shine sweep overlay */}
                    <span className="ss-feature-shine pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
                        transform: 'skewX(-12deg)',
                      }}
                    />

                    {/* Icon container with bounce on hover */}
                    <div
                      className="ss-feature-icon relative flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow:
                          '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 1px 2px 0 rgba(0,0,0,0.35)',
                      }}
                    >
                      <span className="text-[13px] leading-none">{f.icon}</span>

                      {/* Hover glow */}
                      <span
                        className="ss-feature-glow pointer-events-none absolute inset-0 rounded-[8px]"
                        style={{
                          background:
                            'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.28) 0%, transparent 70%)',
                        }}
                      />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1 pt-px">
                      <p
                        className="ss-feature-title text-[12.5px] font-semibold tracking-[-0.008em]"
                        style={{ color: 'rgb(var(--text-base))' }}
                      >
                        {f.title}
                      </p>
                      <p
                        className="ss-feature-desc mt-0.5 text-[11.5px] leading-[1.5] tracking-[-0.003em]"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {f.desc}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="ss-feature-arrow flex-shrink-0 self-center pl-2 text-primary-400 opacity-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {i < FEATURES.length - 1 && (
                    <div
                      className="h-px w-full"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 60%, transparent 100%)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 items-center justify-between gap-3">
            <p
              className="text-[10.5px] font-medium tracking-[-0.002em]"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              © 2026 SyncSpace. Built for teams that create together.
            </p>
            <span className="hidden font-mono text-[10px] tracking-tight text-surface-600 xl:inline">
              v1.0
            </span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Authentication (Outlet)
      ══════════════════════════════════════════════════════ */}
      <main className="relative flex min-w-0 flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-12">

        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div
            className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 62%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-[320px] w-[320px] -translate-x-1/2 translate-y-1/3 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
        </div>

        <div className="relative w-full max-w-[400px] min-w-0">

          <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <div className="relative flex h-[32px] w-[38px] flex-shrink-0 items-center justify-center transition-transform duration-200 ease-out group-hover:scale-[1.05]">
                <img src="/syncspace-logo.png" alt="SyncSpace" className="h-full w-full object-contain" />
              </div>

              <span
                className="text-[15px] font-semibold tracking-[-0.015em]"
                style={{ color: 'rgb(var(--text-base))' }}
              >
                SyncSpace
              </span>
            </Link>

            <div className="flex items-center gap-1.5 opacity-50">
              <span className="h-[3px] w-[3px] rounded-full bg-surface-600" />
              <span className="h-[3px] w-[3px] rounded-full bg-surface-600" />
              <span className="h-[3px] w-[3px] rounded-full bg-surface-600" />
            </div>
          </div>

          <Outlet />

        </div>
      </main>
    </div>
  );
}