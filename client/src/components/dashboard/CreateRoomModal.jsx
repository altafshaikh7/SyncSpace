import { useForm } from 'react-hook-form';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { TbCopy, TbQrcode, TbCheck, TbX, TbUsers, TbLayoutGrid, TbLock, TbWorld } from 'react-icons/tb';
import { useRoomStore } from '../../store/roomStore';

export default function CreateRoomModal({ isOpen, onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const { addRoom } = useRoomStore();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await roomService.create(data);
      const room = res.data.data.room;
      addRoom(room);
      setCreatedRoom(room);
      toast.success('Room created successfully!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const joinUrl = createdRoom
    ? `${window.location.origin}/room/${createdRoom.slug}/collaborate`
    : '';

  const copyRoomId = async () => {
    if (!createdRoom?.slug) return;
    await navigator.clipboard.writeText(createdRoom.slug);
    toast.success('Workspace ID copied!');
  };

  const closeModal = () => {
    setCreatedRoom(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="w-full max-w-[min(480px,calc(100vw-1.5rem))] min-w-0 mx-3 sm:mx-4">

        {/* Modal card */}
        <div className="relative overflow-hidden rounded-2xl border border-surface-800/80 bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_24px_64px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.03)]">

          {/* Top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-800/70 hover:text-white"
            aria-label="Close"
          >
            <TbX size={15} />
          </button>

          {/* ── Header ─────────────────────────────────── */}
          <div className="relative border-b border-surface-800/60 bg-surface-950/30 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-700/10 border border-primary-500/25 text-primary-400">
                {createdRoom ? <TbCheck size={16} /> : <TbUsers size={16} />}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-base">
                  {createdRoom ? 'Workspace Created' : 'Create New Workspace'}
                </h2>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-surface-500 break-words">
                  {createdRoom
                    ? 'Your workspace is ready. Share the ID or QR code to invite your team.'
                    : 'Set up a shared space for your team to collaborate.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────── */}
          <div className="px-5 py-5 sm:px-6 sm:py-6">

            {createdRoom ? (
              <div className="space-y-5">

                {/* Workspace ID block */}
                <div className="rounded-xl border border-primary-500/25 bg-gradient-to-b from-primary-950/30 to-transparent p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="h-1 w-1 rounded-full bg-primary-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-300/90">
                      Workspace ID
                    </p>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-surface-800/80 bg-surface-950/70 px-3 py-2 text-[13px] font-bold tracking-[0.15em] text-primary-200">
                      {createdRoom.slug}
                    </code>

                    <button
                      type="button"
                      onClick={copyRoomId}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-surface-800 bg-surface-900 text-surface-300 transition-all hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 active:scale-95"
                      title="Copy Workspace ID"
                    >
                      <TbCopy size={15} />
                    </button>
                  </div>

                  <p className="mt-2.5 text-[11px] leading-relaxed text-surface-500 break-words">
                    Share this ID with teammates so they can join from the Join Space option.
                  </p>
                </div>

                {/* QR code block */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TbQrcode size={15} className="text-primary-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-surface-400">
                      Scan to Join
                    </span>
                  </div>

                  <div className="rounded-xl border border-surface-800/80 bg-white p-2 shadow-lg shadow-black/20">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`}
                      alt="QR code for joining workspace"
                      className="h-40 w-40 sm:h-44 sm:w-44 rounded-md"
                    />
                  </div>
                </div>

                {/* Done button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-primary w-full sm:w-auto sm:min-w-[110px]"
                  >
                    Done
                  </button>
                </div>

              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Workspace Name */}
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="roomName"
                  >
                    Workspace Name
                  </label>
                  <input
                    id="roomName"
                    type="text"
                    placeholder="e.g. Project Whiteboard"
                    className={errors.name ? 'input-error' : 'input'}
                    {...register('name', { required: 'Room name is required' })}
                  />
                  {errors.name && (
                    <p className="error-text">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="description"
                  >
                    Description
                    <span className="ml-1.5 text-[10px] font-normal normal-case tracking-normal text-surface-500">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    placeholder="Describe the goals or topics for this workspace…"
                    className="input h-20 resize-none w-full min-w-0"
                    {...register('description')}
                  />
                </div>

                {/* Privacy Type */}
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="type"
                  >
                    Privacy
                  </label>
                  <div className="relative">
                    <select
                      id="type"
                      className="input w-full min-w-0 pr-8 appearance-none cursor-pointer"
                      {...register('type')}
                    >
                      <option value="private">Private — Invite only</option>
                      <option value="public">Public — Anyone can discover</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Mode */}
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="activeMode"
                  >
                    Workspace Mode
                  </label>
                  <div className="relative">
                    <select
                      id="activeMode"
                      className="input w-full min-w-0 pr-8 appearance-none cursor-pointer"
                      {...register('activeMode')}
                    >
                      <option value="both">Whiteboard + Code Editor</option>
                      <option value="whiteboard">Whiteboard Only</option>
                      <option value="editor">Code Editor Only</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary w-full sm:w-auto sm:min-w-[100px] justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto sm:min-w-[160px] justify-center"
                  >
                    {loading ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}