import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomService } from '../services';
import toast from 'react-hot-toast';
import { TbLoader2, TbCheck, TbArrowRight, TbSparkles, TbShieldCheck, TbLock } from 'react-icons/tb';

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accept = async () => {
      try {
        const res = await roomService.acceptInvitation(token);
        toast.success(`Welcome to ${res.data.data.room.name}!`);
        navigate(`/room/${res.data.data.room.slug}`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Invitation is invalid, expired, or you are already joined.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    accept();
  }, [token, navigate]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-950 px-4 py-10 sm:px-6 sm:py-14">

      {/* ── Ambient background ──────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary glow */}
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-70"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)',
          }}
        />

        {/* Secondary glow */}
        <div
          className="absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 translate-y-1/4 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse 55% 45% at 50% 42%, black 20%, transparent 70%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 55% 45% at 50% 42%, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Card wrapper ─────────────────────────────────── */}
      <div className="relative w-full max-w-[440px] min-w-0">

        {/* Soft outer glow */}
        <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-gradient-to-b from-primary-500/[0.07] via-transparent to-transparent blur-3xl" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-surface-800/70 bg-[#0c0e14]/90 backdrop-blur-2xl shadow-[0_24px_64px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.03)]">

          {/* Top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />

          {/* Corner accents */}
          <div className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-tl-2xl border-l border-t border-primary-500/15" />
          <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-tr-2xl border-r border-t border-primary-500/15" />

          {/* ── Header ─────────────────────────────────── */}
          <div className="relative flex items-center justify-between gap-3 border-b border-surface-800/50 bg-surface-950/30 px-5 py-3 sm:px-6">

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)] ring-1 ring-primary-400/30">
                <TbSparkles size={12} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="truncate text-[12.5px] font-semibold tracking-tight text-surface-200">
                SyncSpace
              </span>
              <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-surface-700 flex-shrink-0" />
              <span className="hidden sm:inline-block truncate text-[11px] font-medium text-surface-500">
                Invitation
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-2.5 py-1 flex-shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-emerald-400/90">
                Secure
              </span>
            </div>
          </div>

          {/* ── Main ───────────────────────────────────── */}
          <div className="relative px-6 py-11 text-center sm:px-10 sm:py-14">

            {loading ? (
              <div className="space-y-8">

                {/* Loader composition */}
                <div className="relative mx-auto flex h-[100px] w-[100px] items-center justify-center">

                  {/* Outer pulse */}
                  <div className="absolute inset-0 animate-ping rounded-full border border-primary-500/15" />

                  {/* Outer glow */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
                      filter: 'blur(12px)',
                    }}
                  />

                  {/* Ring 1 */}
                  <div className="absolute inset-0 rounded-full border border-primary-500/20 bg-gradient-to-b from-primary-600/[0.08] to-transparent" />

                  {/* Ring 2 - dashed */}
                  <div className="absolute inset-[6px] rounded-full border border-dashed border-primary-500/20" />

                  {/* Ring 3 - inner */}
                  <div className="absolute inset-[14px] rounded-full border border-surface-800/80 bg-surface-950/70 shadow-inner" />

                  {/* Spinner */}
                  <TbLoader2
                    className="relative animate-spin text-primary-400"
                    size={26}
                    strokeWidth={2}
                  />
                </div>

                {/* Text */}
                <div className="space-y-2.5">
                  <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[21px]">
                    Accepting your invitation
                  </h1>
                  <p className="mx-auto max-w-[300px] break-words text-[13px] leading-relaxed text-surface-400">
                    Verifying your invite and adding you to the workspace.
                  </p>
                </div>

                {/* Status strip */}
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-surface-800/70 bg-surface-950/70 px-3 py-1.5 backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-400" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-400">
                    Processing
                  </span>
                </div>

              </div>
            ) : (
              <div className="space-y-8">

                {/* Success composition */}
                <div className="relative mx-auto flex h-[100px] w-[100px] items-center justify-center">

                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
                      filter: 'blur(14px)',
                    }}
                  />

                  {/* Ring 1 */}
                  <div className="absolute inset-0 rounded-full border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-transparent" />

                  {/* Ring 2 - dashed */}
                  <div className="absolute inset-[6px] rounded-full border border-dashed border-emerald-500/20" />

                  {/* Ring 3 - inner */}
                  <div className="absolute inset-[14px] rounded-full border border-emerald-500/20 bg-surface-950/70 shadow-inner" />

                  {/* Check */}
                  <TbCheck
                    className="relative text-emerald-400"
                    size={30}
                    strokeWidth={2.75}
                  />
                </div>

                {/* Text */}
                <div className="space-y-2.5">
                  <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[21px]">
                    Welcome aboard
                  </h1>
                  <p className="mx-auto max-w-[300px] break-words text-[13px] leading-relaxed text-surface-400">
                    Your invitation has been accepted. Taking you to the workspace now.
                  </p>
                </div>

                {/* Redirect indicator */}
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1.5 backdrop-blur">
                  <TbArrowRight size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400/90">
                    Redirecting
                  </span>
                </div>

              </div>
            )}

          </div>

          {/* ── Footer ──────────────────────────────────── */}
          <div className="relative border-t border-surface-800/50 bg-surface-950/40 px-5 py-3 sm:px-6">

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-1.5 min-w-0">
                <TbShieldCheck
                  size={12}
                  className={`flex-shrink-0 transition-colors ${
                    loading ? 'text-surface-500' : 'text-emerald-400/80'
                  }`}
                />
                <span className="truncate text-[10px] font-medium tracking-wide text-surface-500">
                  {loading
                    ? 'Encrypted invitation verification'
                    : 'Verified · End-to-end secured'}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`h-1 w-1 rounded-full transition-colors ${
                    loading ? 'bg-primary-500' : 'bg-surface-700'
                  }`}
                />
                <span
                  className={`h-1 w-1 rounded-full transition-colors ${
                    loading ? 'bg-primary-500/60' : 'bg-surface-700'
                  }`}
                />
                <span
                  className={`h-1 w-1 rounded-full transition-colors ${
                    loading ? 'bg-primary-500/30' : 'bg-surface-700'
                  }`}
                />
              </div>

            </div>
          </div>

        </div>

        {/* Below-card hint */}
        <p className="mt-6 text-center text-[10.5px] font-medium tracking-[0.02em] text-surface-600 transition-colors">
          {loading
            ? 'This usually takes just a moment.'
            : 'Redirect is automatic — no action needed.'}
        </p>

      </div>
    </div>
  );
}