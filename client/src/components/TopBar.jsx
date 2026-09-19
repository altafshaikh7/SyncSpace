import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { useRoomStore } from '../store/roomStore';
import { useSocket } from '../context/SocketContext';
import {
  TbSun,
  TbMoon,
  TbBell,
  TbChevronRight,
  TbMenu2,
  TbArrowBackUp,
  TbArrowForwardUp,
  TbChecks,
  TbCircleFilled,
  TbInbox,
} from 'react-icons/tb';
import { Link, useLocation } from 'react-router-dom';

export default function TopBar() {
  const { user } = useAuthStore();

  const {
    theme,
    toggleTheme,
    notificationsOpen,
    setNotificationsOpen,
    toggleSidebar,
  } = useUIStore();

  const { unreadCount, notifications, markAllRead } = useNotificationStore();
  const { undo, redo } = useWhiteboardStore();
  const { currentRoom } = useRoomStore();
  const { emitWhiteboardEvent } = useSocket();

  const location = useLocation();

  const handleUndo = () => {
    undo();
    setTimeout(() => {
      const currentShapes = useWhiteboardStore.getState().shapes;
      emitWhiteboardEvent(currentRoom?._id, {
        type: 'set_state',
        shapes: currentShapes,
      });
    }, 0);
  };

  const handleRedo = () => {
    redo();
    setTimeout(() => {
      const currentShapes = useWhiteboardStore.getState().shapes;
      emitWhiteboardEvent(currentRoom?._id, {
        type: 'set_state',
        shapes: currentShapes,
      });
    }, 0);
  };

  /* ── Shared toolbar button ─────────────────────── */
  const iconBtn = `
    group relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center
    rounded-[9px] text-surface-400 outline-none
    transition-[color,background-color,transform] duration-150 ease-out
    hover:bg-surface-800/70 hover:text-surface-100
    active:scale-[0.93]
    focus-visible:ring-2 focus-visible:ring-primary-500/40
  `;

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);

    return (
      <nav className="flex min-w-0 items-center text-[12.5px] sm:text-[13px]">
        <Link
          to="/dashboard"
          className="group hidden flex-shrink-0 items-center gap-2 rounded-md px-2 py-1 font-medium text-surface-400 outline-none transition-colors duration-150 hover:text-surface-100 focus-visible:ring-2 focus-visible:ring-primary-500/40 sm:inline-flex"
        >
          <span className="relative flex h-[6px] w-[6px] flex-shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary-400/30" />
            <span className="relative h-[5px] w-[5px] rounded-full bg-primary-400 shadow-[0_0_5px_rgba(129,140,248,0.85)]" />
          </span>
          <span className="tracking-[-0.005em]">SyncSpace</span>
        </Link>

        {paths.map((path, idx) => {
          const isLast = idx === paths.length - 1;
          const raw = path.charAt(0).toUpperCase() + path.slice(1);
          const label = raw.length > 20 ? raw.slice(0, 20) + '…' : raw;

          return (
            <span
              key={`${path}-${idx}`}
              className="flex min-w-0 items-center"
            >
              <TbChevronRight
                size={12}
                strokeWidth={2.4}
                className={`mx-0.5 flex-shrink-0 text-surface-600/60 ${
                  idx === 0 ? 'sm:inline' : ''
                }`}
              />

              <span
                className={`truncate rounded-md px-2 py-1 transition-all duration-150 ${
                  isLast
                    ? 'bg-surface-800/50 font-semibold tracking-[-0.005em] text-surface-100 ring-1 ring-surface-800/70'
                    : 'font-medium text-surface-500 hover:text-surface-200'
                }`}
                title={raw}
              >
                {label}
              </span>
            </span>
          );
        })}
      </nav>
    );
  };

  return (
    <header
      className="relative z-30 flex h-14 flex-shrink-0 items-center gap-3 px-3 backdrop-blur-xl sm:h-14 sm:gap-4 sm:px-5 md:px-6"
      style={{
        backgroundColor: 'rgb(var(--surface-900) / 0.72)',
        borderBottom: '1px solid rgb(var(--surface-800) / 0.85)',
        color: 'rgb(var(--text-base))',
      }}
    >
      {/* Top inner highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ backgroundColor: 'rgb(255 255 255 / 0.03)' }}
      />

      {/* Bottom accent */}
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.22) 25%, rgba(129,140,248,0.08) 55%, transparent 100%)',
        }}
      />

      {/* ═══════════════════════════════════════════════
          LEFT
      ═══════════════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 items-center gap-2">

        <button
          onClick={toggleSidebar}
          className={`${iconBtn} md:hidden`}
          title="Open Menu"
          aria-label="Open Menu"
        >
          <TbMenu2 size={18} strokeWidth={2} />
        </button>

        <div className="min-w-0 flex-1">
          {getBreadcrumbs()}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT
      ═══════════════════════════════════════════════ */}
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-1.5">

        {/* ── Undo / Redo group ────────────────────── */}
        <div
          className="hidden items-center rounded-[10px] p-[3px] sm:flex"
          style={{
            backgroundColor: 'rgb(var(--surface-950) / 0.55)',
            border: '1px solid rgb(var(--surface-800) / 0.85)',
            boxShadow:
              'inset 0 1px 0 0 rgba(255,255,255,0.025), 0 1px 2px 0 rgba(0,0,0,0.25)',
          }}
        >
          <button
            onClick={handleUndo}
            title="Undo"
            aria-label="Undo"
            className="group relative flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[7px] text-surface-400 outline-none transition-all duration-150 hover:bg-surface-800 hover:text-surface-100 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <TbArrowBackUp size={15} strokeWidth={2} />
          </button>

          <span
            className="mx-px h-3.5 w-px flex-shrink-0"
            style={{ backgroundColor: 'rgb(var(--surface-800))' }}
          />

          <button
            onClick={handleRedo}
            title="Redo"
            aria-label="Redo"
            className="group relative flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[7px] text-surface-400 outline-none transition-all duration-150 hover:bg-surface-800 hover:text-surface-100 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <TbArrowForwardUp size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Mobile undo / redo */}
        <button
          onClick={handleUndo}
          title="Undo"
          aria-label="Undo"
          className={`${iconBtn} sm:hidden`}
        >
          <TbArrowBackUp size={17} strokeWidth={2} />
        </button>
        <button
          onClick={handleRedo}
          title="Redo"
          aria-label="Redo"
          className={`${iconBtn} sm:hidden`}
        >
          <TbArrowForwardUp size={17} strokeWidth={2} />
        </button>

        {/* Divider */}
        <span
          className="mx-0.5 hidden h-[18px] w-px flex-shrink-0 sm:inline-block"
          style={{ backgroundColor: 'rgb(var(--surface-800))' }}
        />

        {/* ── Theme toggle ─────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={
            theme === 'dark'
              ? 'Switch to light theme'
              : 'Switch to dark theme'
          }
          aria-label="Toggle theme"
          className={iconBtn}
        >
          <span className="relative flex h-[17px] w-[17px] items-center justify-center">
            <TbSun
              size={17}
              strokeWidth={2}
              className={`absolute transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
                theme === 'dark'
                  ? 'rotate-0 scale-100 opacity-100'
                  : '-rotate-90 scale-0 opacity-0'
              }`}
            />
            <TbMoon
              size={17}
              strokeWidth={2}
              className={`absolute transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
                theme === 'dark'
                  ? 'rotate-90 scale-0 opacity-0'
                  : 'rotate-0 scale-100 opacity-100'
              }`}
            />
          </span>
        </button>

        {/* ── Notifications ────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            aria-label="Notifications"
            className={`${iconBtn} ${
              notificationsOpen
                ? 'bg-surface-800/80 text-surface-100 ring-1 ring-surface-800'
                : ''
            }`}
          >
            <TbBell
              size={17}
              strokeWidth={2}
              className={`transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
                notificationsOpen ? 'rotate-[10deg]' : ''
              }`}
            />

            {unreadCount > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px]">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary-400/40" />
                <span
                  className="relative flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white tabular-nums"
                  style={{
                    backgroundColor: 'rgb(99,102,241)',
                    boxShadow:
                      '0 0 0 2px rgb(var(--surface-900)), 0 0 8px rgba(99,102,241,0.55)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* ── Notification dropdown ──────────────── */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />

              <div
                className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1.25rem)] max-w-[420px] origin-top-right overflow-hidden rounded-2xl sm:w-[420px]"
                style={{
                  backgroundColor: 'rgb(var(--surface-900))',
                  border: '1px solid rgb(var(--surface-800))',
                  boxShadow:
                    '0 24px 60px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.025) inset, 0 1px 0 0 rgba(255,255,255,0.04) inset',
                  backdropFilter: 'blur(24px)',
                  animation:
                    'topbarDropIn 180ms cubic-bezier(.4,0,.2,1)',
                }}
              >
                <style>{`
                  @keyframes topbarDropIn {
                    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  @keyframes topbarRowIn {
                    from { opacity: 0; transform: translateY(3px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                {/* Top accent */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(129,140,248,0.55), transparent)',
                  }}
                />

                {/* Header */}
                <div
                  className="relative flex items-center justify-between gap-3 px-4 py-3.5"
                  style={{
                    borderBottom: '1px solid rgb(var(--surface-800) / 0.85)',
                    backgroundColor: 'rgb(var(--surface-950) / 0.5)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] bg-primary-500/[0.10] ring-1 ring-primary-500/20">
                      <TbBell
                        size={13}
                        className="text-primary-300"
                        strokeWidth={2.2}
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_5px_rgba(129,140,248,0.9)]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className="truncate text-[13px] font-semibold leading-tight tracking-[-0.005em]"
                        style={{ color: 'rgb(var(--text-base))' }}
                      >
                        Notifications
                      </h3>
                      <p
                        className="truncate text-[10.5px] font-medium"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {unreadCount > 0
                          ? `${unreadCount} unread ${unreadCount === 1 ? 'item' : 'items'}`
                          : 'You\u2019re all caught up'}
                      </p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="group flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-primary-400 outline-none transition-all duration-150 hover:bg-primary-500/10 hover:text-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500/40"
                    >
                      <TbChecks
                        size={13}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[24rem] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-primary-500/12 blur-2xl" />
                        <div
                          className="relative flex h-16 w-16 items-center justify-center rounded-2xl ring-1"
                          style={{
                            backgroundColor:
                              'rgb(var(--surface-950) / 0.7)',
                            borderColor: 'rgb(var(--surface-800))',
                            boxShadow:
                              'inset 0 1px 0 0 rgba(255,255,255,0.03)',
                          }}
                        >
                          <TbInbox
                            size={24}
                            className="text-surface-500"
                            strokeWidth={1.6}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p
                          className="text-[13.5px] font-semibold tracking-[-0.005em]"
                          style={{ color: 'rgb(var(--text-base))' }}
                        >
                          You&apos;re all caught up
                        </p>
                        <p
                          className="mx-auto max-w-[260px] text-[11.5px] leading-relaxed"
                          style={{ color: 'rgb(var(--text-muted))' }}
                        >
                          New notifications from your workspace will show up
                          here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((n, idx) => (
                        <div
                          key={n.id}
                          className={`group relative flex gap-3 px-4 py-3.5 transition-colors duration-150 ${
                            n.read
                              ? 'hover:bg-surface-800/25'
                              : 'bg-primary-500/[0.05] hover:bg-primary-500/[0.08]'
                          }`}
                          style={{
                            borderBottom:
                              idx === notifications.length - 1
                                ? 'none'
                                : '1px solid rgb(var(--surface-800) / 0.5)',
                            animation: `topbarRowIn 220ms cubic-bezier(.4,0,.2,1) both`,
                            animationDelay: `${Math.min(idx * 25, 200)}ms`,
                          }}
                        >
                          {/* Left accent for unread */}
                          {!n.read && (
                            <span
                              className="absolute left-0 top-1/2 h-7 w-[2.5px] -translate-y-1/2 rounded-r-full"
                              style={{
                                background:
                                  'linear-gradient(180deg, rgba(129,140,248,0.9), rgba(99,102,241,1), rgba(129,140,248,0.9))',
                                boxShadow:
                                  '0 0 10px rgba(129,140,248,0.75)',
                              }}
                            />
                          )}

                          {/* Status dot */}
                          <div className="mt-[6px] flex-shrink-0">
                            {n.read ? (
                              <span className="block h-1.5 w-1.5 rounded-full bg-surface-700" />
                            ) : (
                              <span className="block h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_6px_rgba(129,140,248,0.85)]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`break-words text-[12.5px] leading-[1.55] ${
                                n.read ? 'font-normal' : 'font-medium'
                              }`}
                              style={{
                                color: n.read
                                  ? 'rgb(var(--text-muted))'
                                  : 'rgb(var(--text-base))',
                              }}
                            >
                              {n.message}
                            </p>

                            <div className="mt-1.5 flex items-center gap-2">
                              <span
                                className="text-[10.5px] font-medium tracking-[0.005em] tabular-nums"
                                style={{ color: 'rgb(var(--text-muted))' }}
                              >
                                {new Date(
                                  n.createdAt
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {!n.read && (
                                <span className="rounded-full bg-primary-500/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-primary-300">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                    style={{
                      borderTop: '1px solid rgb(var(--surface-800) / 0.85)',
                      backgroundColor: 'rgb(var(--surface-950) / 0.4)',
                    }}
                  >
                    <span
                      className="text-[10px] font-medium tracking-wide"
                      style={{ color: 'rgb(var(--text-muted))' }}
                    >
                      Showing {notifications.length}{' '}
                      {notifications.length === 1 ? 'item' : 'items'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <TbCircleFilled
                        size={5}
                        className="text-emerald-400"
                      />
                      <span
                        className="text-[10px] font-medium tracking-wide"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        Live
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <span
          className="mx-0.5 hidden h-[18px] w-px flex-shrink-0 sm:inline-block"
          style={{ backgroundColor: 'rgb(var(--surface-800))' }}
        />

        {/* ── Avatar ───────────────────────────────── */}
        {user && (
          <div className="group relative flex-shrink-0">
            <span
              className="pointer-events-none absolute -inset-[3px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  'conic-gradient(from 90deg, rgba(129,140,248,0.8), rgba(99,102,241,0.2), rgba(129,140,248,0.8))',
                filter: 'blur(6px)',
              }}
            />

            <div
              className="relative flex h-8 w-8 cursor-default items-center justify-center overflow-hidden rounded-full text-[11.5px] font-semibold text-white ring-[1.5px] ring-surface-800 transition-all duration-200 group-hover:ring-primary-500/60"
              style={{
                background:
                  'linear-gradient(135deg, rgb(79,70,229) 0%, rgb(55,48,163) 100%)',
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.15), 0 2px 6px -2px rgba(0,0,0,0.5)',
              }}
              title={user.name}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}

              <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/15 to-transparent" />
            </div>

            <span
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-[10px] w-[10px] rounded-full bg-emerald-400"
              style={{
                boxShadow:
                  '0 0 0 2px rgb(var(--surface-900)), 0 0 6px rgba(52,211,153,0.6)',
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}