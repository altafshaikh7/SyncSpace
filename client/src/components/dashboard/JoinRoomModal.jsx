import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { TbLogin, TbLoader2, TbArrowRight, TbHash } from 'react-icons/tb';

export default function JoinRoomModal({ isOpen, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await roomService.getBySlug(data.slug);
      toast.success('Workspace found! Entering room...');
      reset();
      onClose();
      navigate(`/room/${res.data.data.room.slug}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Workspace ID is invalid or access was denied.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="w-full max-w-[min(440px,calc(100vw-1.5rem))] min-w-0 mx-auto">

        {/* Modal card */}
        <div className="relative overflow-hidden rounded-2xl border border-surface-800/80 bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_24px_64px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.03)]">

          {/* Top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/55 to-transparent" />

          {/* Corner accents */}
          <div className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-tl-2xl border-l border-t border-primary-500/15" />
          <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-tr-2xl border-r border-t border-primary-500/15" />

          {/* ── Header ─────────────────────────────────── */}
          <div className="relative border-b border-surface-800/60 bg-surface-950/40 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3.5">

              {/* Icon */}
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/25 to-primary-700/10 border border-primary-500/25 text-primary-300">
                <TbLogin size={17} strokeWidth={2.2} />

                {/* Live dot */}
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0e14]" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white sm:text-base">
                  Join Workspace
                </h2>
                <p className="mt-1 break-words text-[11.5px] leading-relaxed text-surface-500 sm:text-[12px]">
                  Enter the workspace ID shared by your teammate to join.
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-5 py-5 space-y-5 sm:px-6 sm:py-6"
          >

            {/* Slug input */}
            <div className="min-w-0">
              <label
                className="label"
                htmlFor="slug"
              >
                Workspace ID
              </label>

              <div className="relative">
                {/* Prefix hash icon */}
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                  <TbHash size={14} strokeWidth={2.2} />
                </span>

                <input
                  id="slug"
                  type="text"
                  placeholder="e.g. a1b2c3d4"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${errors.slug ? 'input-error' : 'input'} pl-9 font-mono tracking-[0.06em]`}
                  {...register('slug', {
                    required: 'Workspace slug is required',
                  })}
                />
              </div>

              {errors.slug ? (
                <p className="error-text">{errors.slug.message}</p>
              ) : (
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-surface-600">
                  Ask the workspace owner for this ID.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary w-full justify-center sm:w-auto sm:min-w-[100px] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary group w-full justify-center sm:w-auto sm:min-w-[160px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <TbLoader2
                      size={15}
                      className="animate-spin"
                      strokeWidth={2.4}
                    />
                    <span>Searching...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Join Workspace</span>
                    <TbArrowRight
                      size={15}
                      strokeWidth={2.2}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* ── Footer hint ────────────────────────────── */}
          <div className="relative border-t border-surface-800/60 bg-surface-950/40 px-5 py-2.5 sm:px-6">
            <p className="text-center text-[10.5px] font-medium tracking-wide text-surface-600">
              Invite-only workspaces require an active invitation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}