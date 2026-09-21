import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { roomService, userService } from '../services';
import CreateRoomModal from '../components/dashboard/CreateRoomModal';
import JoinRoomModal from '../components/dashboard/JoinRoomModal';

import {
  TbPlus,
  TbSearch,
  TbCompass,
  TbClock,
  TbUsers,
  TbLock,
  TbLockOpen,
  TbArrowRight,
  TbLayoutColumns,
  TbBrush,
  TbCode,
  TbBolt,
  TbMail,
  TbCheck,
  TbStar,
  TbStarFilled,
  TbTrash,
  TbActivity,
  TbInbox,
} from 'react-icons/tb';

import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';

  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';

  return 'Good evening';
}

const ACTION_ICONS = {
  room_created: '🏠',
  room_joined: '🚪',
  session_started: '▶️',
  code_edit: '💻',
  draw: '🎨',
  chat: '💬',
  file_upload: '📁',
};

const ACTION_TONES = {
  room_created: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/25',
  room_joined: 'bg-sky-500/10 text-sky-500 ring-sky-500/25',
  session_started: 'bg-violet-500/10 text-violet-500 ring-violet-500/25',
  code_edit: 'bg-cyan-500/10 text-cyan-500 ring-cyan-500/25',
  draw: 'bg-pink-500/10 text-pink-500 ring-pink-500/25',
  chat: 'bg-amber-500/10 text-amber-500 ring-amber-500/25',
  file_upload: 'bg-orange-500/10 text-orange-500 ring-orange-500/25',
};

const STYLES = `
  @keyframes dsh-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dsh-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes dsh-wave {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(14deg); }
    40% { transform: rotate(-8deg); }
    60% { transform: rotate(10deg); }
    80% { transform: rotate(-4deg); }
  }
  @keyframes dsh-card-in {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes dsh-shine {
    0% { transform: translateX(-140%) skewX(-15deg); opacity: 0; }
    40% { opacity: 0.5; }
    100% { transform: translateX(280%) skewX(-15deg); opacity: 0; }
  }
  @keyframes dsh-pulse-ring {
    0% { transform: scale(0.9); opacity: 0.7; }
    70% { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .dsh-enter { animation: dsh-fade-up 560ms cubic-bezier(.4,0,.2,1) both; }
  .dsh-enter-1 { animation-delay: 30ms; }
  .dsh-enter-2 { animation-delay: 100ms; }
  .dsh-enter-3 { animation-delay: 180ms; }
  .dsh-enter-4 { animation-delay: 260ms; }
  .dsh-enter-5 { animation-delay: 340ms; }

  .dsh-card-enter { animation: dsh-card-in 500ms cubic-bezier(.4,0,.2,1) both; }
  .dsh-row-enter { animation: dsh-fade-in 420ms ease-out both; }

  .dsh-wave-emoji {
    display: inline-block;
    animation: dsh-wave 2.4s ease-in-out 500ms;
    transform-origin: 70% 70%;
  }

  .dsh-card {
    position: relative;
    transition:
      transform 300ms cubic-bezier(.4,0,.2,1),
      border-color 220ms ease,
      background-color 220ms ease,
      box-shadow 300ms ease;
  }
  .dsh-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 44px -24px rgba(0,0,0,0.35);
  }
  .dsh-card .dsh-shine {
    opacity: 0;
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
  }
  .dsh-card .dsh-shine::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -40%;
    width: 40%;
    background: linear-gradient(
      90deg,
      transparent,
      rgb(var(--text-base) / 0.055),
      transparent
    );
  }
  .dsh-card:hover .dsh-shine::before {
    animation: dsh-shine 950ms cubic-bezier(.4,0,.2,1);
  }

  /* Live pulse indicator */
  .dsh-live-dot {
    position: relative;
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background-color: rgb(16 185 129);
  }
  .dsh-live-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background-color: rgb(16 185 129);
    animation: dsh-pulse-ring 1.8s cubic-bezier(.4,0,.2,1) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .dsh-enter, .dsh-card-enter, .dsh-row-enter, .dsh-wave-emoji,
    .dsh-card .dsh-shine::before, .dsh-live-dot::after {
      animation: none !important;
    }
  }
`;

export default function DashboardPage() {
  const { myRooms, setMyRooms } = useRoomStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [activity, setActivity] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  const [deletingActivityId, setDeletingActivityId] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starred_rooms') || '[]');
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('starred_rooms', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (roomId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setFavorites((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsRes, actRes, invRes] = await Promise.all([
          roomService.getMy(),
          userService.getActivityLog({ limit: 8 }),
          roomService.getPendingInvitations(),
        ]);

        setMyRooms(roomsRes.data.data.rooms);
        setActivity(actRes.data.data.logs || []);
        setPendingInvites(invRes.data.data.invitations || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setMyRooms]);

  const handleDeleteActivity = async (activityId) => {
    if (!activityId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this activity?'
    );

    if (!confirmed) return;

    try {
      setDeletingActivityId(activityId);

      await userService.deleteActivityLog(activityId);

      setActivity((prev) => prev.filter((log) => log._id !== activityId));

      toast.success('Activity deleted.');
    } catch (err) {
      console.error('Delete activity error:', err);

      toast.error(
        err?.response?.data?.message || 'Failed to delete activity.'
      );
    } finally {
      setDeletingActivityId(null);
    }
  };

  const totalMembers = myRooms.reduce(
    (acc, room) => acc + (room.members?.length || 0),
    0
  );

  const activeRooms = myRooms.filter((room) => room.isActive).length;

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <style>{STYLES}</style>

      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-5 sm:py-6 md:space-y-7 md:px-6 md:py-8">

        {/* ══════════════════════════════════════════════
            HEADER / WELCOME
        ══════════════════════════════════════════════ */}
        <section
          className="dsh-enter dsh-enter-1 relative overflow-hidden rounded-2xl border p-4 sm:p-6 md:p-7"
          style={{
            borderColor: 'rgb(var(--surface-800))',
            background:
              'linear-gradient(180deg, rgb(var(--surface-900) / 0.75) 0%, rgb(var(--surface-900) / 0.15) 100%)',
          }}
        >
          {/* Top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

          {/* Corner glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary-600/[0.09] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/4 h-48 w-48 rounded-full bg-primary-500/[0.05] blur-3xl" />

          {/* Fine grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgb(var(--text-base)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-base)) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage:
                'radial-gradient(ellipse 65% 75% at 15% 40%, black 20%, transparent 78%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 65% 75% at 15% 40%, black 20%, transparent 78%)',
            }}
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">

            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-500">
                  Workspace Overview
                </span>
              </div>

              <h1
                className="text-[26px] font-bold leading-[1.1] tracking-[-0.028em] break-words sm:text-3xl md:text-[32px]"
                style={{ color: 'rgb(var(--text-base))' }}
              >
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                  {user?.name?.split(' ')[0] || 'there'}
                </span>{' '}
                <span className="dsh-wave-emoji">👋</span>
              </h1>

              <p
                className="mt-2.5 max-w-xl break-words text-[13px] leading-relaxed sm:text-sm"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Create or join collaborative real-time sync spaces.
              </p>
            </div>

            {/* Right — actions */}
            <div className="flex w-full flex-col gap-2 xs:flex-row sm:flex-row md:w-auto md:flex-shrink-0 md:flex-nowrap">
              <button
                onClick={() => setJoinOpen(true)}
                className="btn-secondary group w-full justify-center whitespace-nowrap transition-transform active:scale-[0.97] md:w-auto"
              >
                <TbSearch
                  size={17}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>Join Space</span>
              </button>

              <button
                onClick={() => setCreateOpen(true)}
                className="btn-primary group w-full justify-center whitespace-nowrap transition-transform active:scale-[0.97] md:w-auto"
              >
                <TbPlus
                  size={17}
                  className="transition-transform duration-300 group-hover:rotate-90"
                />
                <span>Create Space</span>
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PENDING INVITATIONS
        ══════════════════════════════════════════════ */}
        {pendingInvites.length > 0 && (
          <section
            className="dsh-enter dsh-enter-2 relative overflow-hidden rounded-2xl border p-4 sm:p-5"
            style={{
              borderColor: 'rgb(99 102 241 / 0.28)',
              background:
                'linear-gradient(180deg, rgb(99 102 241 / 0.09) 0%, transparent 100%)',
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary-600/[0.10] blur-3xl" />

            <div className="relative">
              <div className="mb-3 flex items-center gap-3">
                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/[0.14] ring-1 ring-primary-500/30">
                  <TbMail size={15} className="text-primary-500" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_6px_rgba(99,102,241,0.9)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    className="truncate text-[13px] font-semibold tracking-[-0.005em] sm:text-sm"
                    style={{ color: 'rgb(var(--text-base))' }}
                  >
                    Pending Invitations
                  </h2>
                  <p
                    className="truncate text-[10.5px] font-medium"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    {pendingInvites.length}{' '}
                    {pendingInvites.length === 1 ? 'invitation' : 'invitations'}{' '}
                    waiting for you
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {pendingInvites.map((inv, idx) => (
                  <div
                    key={inv._id}
                    className="dsh-card-enter group flex flex-col gap-3 rounded-xl border px-3 py-3 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      animationDelay: `${80 + idx * 60}ms`,
                      borderColor: 'rgb(var(--surface-800))',
                      backgroundColor: 'rgb(var(--surface-900) / 0.55)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgb(99 102 241 / 0.4)';
                      e.currentTarget.style.backgroundColor =
                        'rgb(var(--surface-900) / 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgb(var(--surface-800))';
                      e.currentTarget.style.backgroundColor =
                        'rgb(var(--surface-900) / 0.55)';
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[12.5px] font-semibold sm:text-sm"
                        style={{ color: 'rgb(var(--text-base))' }}
                      >
                        {inv.room?.name || 'Unknown Room'}
                      </p>

                      <p
                        className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        <span className="truncate">
                          Invited by{' '}
                          <span className="font-medium text-primary-500">
                            {inv.invitedBy?.name}
                          </span>
                        </span>
                        <span className="opacity-40">·</span>
                        <span
                          className="rounded border px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wider"
                          style={{
                            borderColor: 'rgb(var(--surface-800))',
                            backgroundColor: 'rgb(var(--surface-950) / 0.6)',
                            color: 'rgb(var(--text-muted))',
                          }}
                        >
                          {inv.role}
                        </span>
                      </p>
                    </div>

                    <a
                      href={`/invite/${inv.token}`}
                      className="group/btn flex w-full flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm shadow-primary-950/40 transition-all duration-150 hover:bg-primary-500 active:scale-[0.96] sm:w-auto"
                    >
                      <TbCheck
                        size={13}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover/btn:scale-110"
                      />
                      <span>Accept</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            STATS
        ══════════════════════════════════════════════ */}
        <section className="dsh-enter dsh-enter-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">

          {[
            {
              icon: <TbCompass size={18} />,
              tone: 'text-primary-500',
              bg: 'bg-primary-500/10',
              ring: 'ring-primary-500/25',
              glow: 'bg-primary-500/[0.10]',
              label: 'My Workspaces',
              value: loading ? null : myRooms.length,
            },
            {
              icon: <TbUsers size={18} />,
              tone: 'text-emerald-500',
              bg: 'bg-emerald-500/10',
              ring: 'ring-emerald-500/25',
              glow: 'bg-emerald-500/[0.10]',
              label: 'Total Members',
              value: loading ? null : totalMembers,
            },
            {
              icon: <TbBolt size={18} />,
              tone: 'text-amber-500',
              bg: 'bg-amber-500/10',
              ring: 'ring-amber-500/25',
              glow: 'bg-amber-500/[0.10]',
              label: 'Active Spaces',
              value: loading ? null : activeRooms,
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="dsh-card-enter group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                animationDelay: `${60 + idx * 80}ms`,
                borderColor: 'rgb(var(--surface-800))',
                backgroundColor: 'rgb(var(--surface-900) / 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgb(var(--surface-700))';
                e.currentTarget.style.backgroundColor =
                  'rgb(var(--surface-900) / 0.75)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgb(var(--surface-800))';
                e.currentTarget.style.backgroundColor =
                  'rgb(var(--surface-900) / 0.4)';
              }}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full ${stat.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative flex items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 ${stat.bg} ${stat.ring} ${stat.tone}`}
                >
                  {stat.icon}
                </div>

                <div className="min-w-0">
                  {loading ? (
                    <div className="skeleton h-6 w-12 rounded-md" />
                  ) : (
                    <p
                      className="text-[22px] font-bold leading-none tracking-[-0.02em] tabular-nums"
                      style={{ color: 'rgb(var(--text-base))' }}
                    >
                      {stat.value}
                    </p>
                  )}

                  <p
                    className="mt-1.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">

          {/* ── WORKSPACES ─────────────────────────── */}
          <div className="dsh-enter dsh-enter-4 min-w-0 space-y-4 lg:col-span-2">

            {/* Section header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/10 ring-1 ring-primary-500/20">
                  <TbCompass size={14} className="text-primary-500" />
                </div>
                <div className="min-w-0 flex items-baseline gap-2">
                  <h2
                    className="truncate text-[15px] font-semibold tracking-[-0.01em] sm:text-base"
                    style={{ color: 'rgb(var(--text-base))' }}
                  >
                    My Workspaces
                  </h2>
                  {!loading && myRooms.length > 0 && (
                    <span
                      className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                      style={{
                        borderColor: 'rgb(var(--surface-800))',
                        backgroundColor: 'rgb(var(--surface-900) / 0.7)',
                        color: 'rgb(var(--text-muted))',
                      }}
                    >
                      {myRooms.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="dsh-card-enter rounded-xl border p-5"
                    style={{
                      animationDelay: `${60 + i * 60}ms`,
                      borderColor: 'rgb(var(--surface-800) / 0.7)',
                      backgroundColor: 'rgb(var(--surface-900) / 0.4)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="skeleton h-5 w-2/3 rounded-md" />
                      <div className="skeleton h-4 w-4 rounded-full" />
                    </div>
                    <div className="mt-3 skeleton h-3 w-5/6 rounded-md" />
                    <div className="mt-2 skeleton h-3 w-2/3 rounded-md" />
                    <div className="mt-6 flex items-center justify-between gap-2">
                      <div className="skeleton h-3 w-1/3 rounded-md" />
                      <div className="skeleton h-7 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myRooms.length === 0 ? (
              <div
                className="dsh-card-enter relative overflow-hidden rounded-2xl border p-8 text-center sm:p-14"
                style={{
                  borderColor: 'rgb(var(--surface-800))',
                  background:
                    'linear-gradient(180deg, rgb(var(--surface-900) / 0.65) 0%, rgb(var(--surface-900) / 0.15) 100%)',
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/45 to-transparent" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/[0.07] blur-3xl" />

                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-primary-500/15 blur-2xl" />
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/30 ring-1 ring-primary-500/10"
                    style={{ backgroundColor: 'rgb(var(--surface-900) / 0.7)' }}
                  >
                    <TbLayoutColumns size={26} className="text-primary-500" />
                  </div>
                </div>

                <div className="relative space-y-1.5">
                  <p
                    className="text-[15px] font-semibold tracking-[-0.005em]"
                    style={{ color: 'rgb(var(--text-base))' }}
                  >
                    No workspaces yet
                  </p>
                  <p
                    className="mx-auto max-w-xs break-words text-[12.5px] leading-relaxed"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    Create one to begin collaborating!
                  </p>
                </div>

                <button
                  onClick={() => setCreateOpen(true)}
                  className="btn-primary group relative mx-auto mt-5 transition-transform active:scale-[0.97]"
                >
                  <TbPlus
                    size={16}
                    className="transition-transform duration-300 group-hover:rotate-90"
                  />
                  Create First Space
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">

                {[...myRooms]
                  .sort((a, b) => {
                    const aFav = favorites.includes(a._id) ? 1 : 0;
                    const bFav = favorites.includes(b._id) ? 1 : 0;
                    return bFav - aFav;
                  })
                  .map((room, idx) => {
                    const isFav = favorites.includes(room._id);

                    return (
                      <div
                        key={room._id}
                        className={`dsh-card dsh-card-enter group relative flex min-w-0 flex-col overflow-hidden rounded-xl border ${
                          isFav
                            ? 'border-amber-500/30 hover:border-amber-500/55'
                            : 'border-surface-800/80 hover:border-primary-500/50'
                        }`}
                        style={{
                          animationDelay: `${80 + idx * 50}ms`,
                          backgroundColor: 'rgb(var(--surface-900) / 0.4)',
                        }}
                      >
                        <div className="dsh-shine" />

                        {isFav && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                        )}

                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3
                                className={`truncate text-[13.5px] font-semibold tracking-[-0.005em] transition-colors duration-200 sm:text-sm ${
                                  isFav
                                    ? 'text-[rgb(var(--text-base))] group-hover:text-amber-500'
                                    : 'text-[rgb(var(--text-base))] group-hover:text-primary-500'
                                }`}
                                title={room.name}
                              >
                                {room.name}
                              </h3>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-1">
                              <button
                                onClick={(e) => toggleFavorite(room._id, e)}
                                title={
                                  isFav ? 'Unpin Workspace' : 'Pin Workspace'
                                }
                                aria-label={
                                  isFav ? 'Unpin Workspace' : 'Pin Workspace'
                                }
                                className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 active:scale-90 ${
                                  isFav
                                    ? 'text-amber-500'
                                    : 'text-[rgb(var(--text-muted))] hover:text-amber-500'
                                }`}
                              >
                                {isFav ? (
                                  <TbStarFilled size={13} />
                                ) : (
                                  <TbStar size={13} />
                                )}
                              </button>

                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-md"
                                title={
                                  room.type === 'public'
                                    ? 'Public workspace'
                                    : 'Private workspace'
                                }
                              >
                                {room.type === 'public' ? (
                                  <TbLockOpen
                                    size={13}
                                    className="text-emerald-500"
                                  />
                                ) : (
                                  <TbLock
                                    size={13}
                                    className="text-amber-500"
                                  />
                                )}
                              </span>
                            </div>
                          </div>

                          <p
                            className="mt-1.5 line-clamp-2 break-words text-[12px] leading-relaxed"
                            style={{ color: 'rgb(var(--text-muted))' }}
                          >
                            {room.description || 'No description provided.'}
                          </p>

                          <div
                            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-medium"
                            style={{ color: 'rgb(var(--text-muted))' }}
                          >
                            <span className="flex items-center gap-1">
                              <TbUsers size={11} />
                              <span className="tabular-nums">
                                {room.members?.length || 0}
                              </span>
                              <span>members</span>
                            </span>

                            <span
                              className="h-3 w-px"
                              style={{
                                backgroundColor: 'rgb(var(--surface-800))',
                              }}
                            />

                            <span className="flex items-center gap-1">
                              <TbClock size={11} />
                              <span>
                                {timeAgo(room.lastActivity || room.updatedAt)}
                              </span>
                            </span>

                            <span
                              className="h-3 w-px"
                              style={{
                                backgroundColor: 'rgb(var(--surface-800))',
                              }}
                            />

                            <span className="flex items-center gap-1">
                              {room.activeMode === 'both' && (
                                <>
                                  <TbBrush size={11} />
                                  <TbCode size={11} />
                                </>
                              )}
                              {room.activeMode === 'whiteboard' && (
                                <TbBrush size={11} />
                              )}
                              {room.activeMode === 'editor' && (
                                <TbCode size={11} />
                              )}
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/room/${room.slug}/collaborate`}
                          className={`relative flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 sm:px-5 ${
                            isFav
                              ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-500 hover:bg-amber-500/[0.12]'
                              : 'border-surface-800/80 bg-surface-950/40 text-primary-500 hover:bg-primary-500/[0.09]'
                          }`}
                        >
                          <span>Open Space</span>
                          <TbArrowRight
                            size={14}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </Link>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── ACTIVITY FEED ──────────────────────── */}
          <div className="dsh-enter dsh-enter-5 min-w-0 space-y-4 lg:col-span-1">

            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/10 ring-1 ring-primary-500/20">
                <TbActivity size={14} className="text-primary-500" />
              </div>
              <h2
                className="truncate text-[15px] font-semibold tracking-[-0.01em] sm:text-base"
                style={{ color: 'rgb(var(--text-base))' }}
              >
                Activity Feed
              </h2>
            </div>

            <div
              className="relative overflow-hidden rounded-xl border"
              style={{
                borderColor: 'rgb(var(--surface-800))',
                backgroundColor: 'rgb(var(--surface-900) / 0.4)',
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">
                {loading ? (
                  <div className="space-y-4 p-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="skeleton h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-3.5 w-5/6 rounded-md" />
                          <div className="skeleton h-3 w-1/3 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-primary-500/10 blur-2xl" />
                      <div
                        className="relative flex h-14 w-14 items-center justify-center rounded-2xl border ring-1"
                        style={{
                          borderColor: 'rgb(var(--surface-800))',
                          backgroundColor: 'rgb(var(--surface-950) / 0.6)',
                        }}
                      >
                        <TbInbox
                          size={22}
                          className="text-[rgb(var(--text-muted))]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: 'rgb(var(--text-base))' }}
                      >
                        No recent activity
                      </p>
                      <p
                        className="mx-auto max-w-[220px] break-words text-[11.5px] leading-relaxed"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        Actions you take in workspaces will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="divide-y"
                    style={{ borderColor: 'rgb(var(--surface-800) / 0.5)' }}
                  >
                    {activity.map((log, idx) => (
                      <div
                        key={log._id}
                        className="dsh-row-enter group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface-800/25"
                        style={{
                          animationDelay: `${100 + idx * 45}ms`,
                          borderColor: 'rgb(var(--surface-800) / 0.5)',
                        }}
                      >
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[14px] ring-1 transition-transform duration-200 group-hover:scale-105 ${
                            ACTION_TONES[log.action] ||
                            'bg-surface-800/60 text-surface-400 ring-surface-700/50'
                          }`}
                        >
                          {ACTION_ICONS[log.action] || '🔔'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-[12.5px] font-semibold capitalize tracking-[-0.005em]"
                                style={{ color: 'rgb(var(--text-base))' }}
                              >
                                {log.action.replace(/_/g, ' ')}
                              </p>

                              {log.room && (
                                <p
                                  className="mt-0.5 truncate text-[11px]"
                                  style={{ color: 'rgb(var(--text-muted))' }}
                                >
                                  in{' '}
                                  <span
                                    className="font-medium"
                                    style={{ color: 'rgb(var(--text-base))' }}
                                  >
                                    {log.room.name}
                                  </span>
                                </p>
                              )}

                              <p
                                className="mt-0.5 text-[10px] font-medium tracking-wide"
                                style={{ color: 'rgb(var(--text-muted))' }}
                              >
                                {timeAgo(log.createdAt)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(log._id)}
                              disabled={deletingActivityId === log._id}
                              title="Delete activity"
                              aria-label="Delete activity"
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md outline-none transition-all duration-150 hover:bg-red-500/10 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                              style={{ color: 'rgb(var(--text-muted))' }}
                            >
                              {deletingActivityId === log._id ? (
                                <span
                                  className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                                  style={{
                                    borderColor: 'rgb(var(--text-muted))',
                                    borderTopColor: 'transparent',
                                  }}
                                />
                              ) : (
                                <TbTrash size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MODALS
        ══════════════════════════════════════════════ */}
        <CreateRoomModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />

        <JoinRoomModal
          isOpen={joinOpen}
          onClose={() => setJoinOpen(false)}
        />

      </div>
    </div>
  );
}