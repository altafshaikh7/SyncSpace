import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useRoomStore } from '../../store/roomStore';
import { authService } from '../../services';
import { TbLayoutDashboard, TbUser, TbLogout, TbMenu2, TbX } from 'react-icons/tb';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { currentRoom } = useRoomStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: <TbLayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'Profile',   icon: <TbUser size={18} />,            path: '/profile'   },
  ];

  return (
    <>
      {/* ── Mobile backdrop with fade ─────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden transition-[width,transform] duration-300 ease-[cubic-bezier(.4,0,.2,1)] md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          sidebarOpen
            ? 'w-[288px] max-w-[calc(100vw-32px)] translate-x-0 md:w-[268px] md:max-w-none'
            : 'w-[76px] max-w-[76px] -translate-x-full md:translate-x-0 md:w-[76px]'
        }`}
        style={{
          backgroundColor: 'rgb(var(--surface-900))',
          borderRight: '1px solid rgb(var(--surface-800))',
          boxShadow: sidebarOpen
            ? '4px 0 40px -16px rgba(0,0,0,0.7)'
            : '2px 0 24px -14px rgba(0,0,0,0.5)',
        }}
      >

        {/* ── Ambient background layers ─────────────────── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-24 -top-24 h-64 w-64 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        {/* ══════════════════════════════════════════════════
            BRAND HEADER
        ══════════════════════════════════════════════════ */}
        <div
          className={`relative flex flex-shrink-0 ${
            sidebarOpen
              ? 'h-[68px] items-center gap-2 px-3 sm:px-4'
              : 'flex-col items-center gap-2 px-2 py-3'
          }`}
          style={{ borderBottom: '1px solid rgb(var(--surface-800))' }}
        >
          <Link
            to="/dashboard"
            className={`group flex min-w-0 items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
              sidebarOpen ? 'flex-1 gap-3 py-1.5 px-1' : 'p-0.5'
            }`}
            title={!sidebarOpen ? 'SyncSpace' : undefined}
          >
            <div className="relative flex h-[38px] w-[42px] flex-shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.05]">
              <img src="/syncspace-logo.png" alt="SyncSpace" className="h-full w-full object-contain" />
            </div>

            {sidebarOpen && (
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  className="truncate text-[14.5px] font-semibold tracking-[-0.015em]"
                  style={{ color: 'rgb(var(--text-base))' }}
                >
                  SyncSpace
                </span>
                <span
                  className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  Workspace
                </span>
              </div>
            )}
          </Link>

          {sidebarOpen && (
            <>
              <button
                onClick={toggleSidebar}
                className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-500 outline-none transition-all duration-150 hover:bg-surface-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/50 md:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <TbMenu2 size={16} />
              </button>
              <button
                onClick={toggleSidebar}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-500 outline-none transition-all duration-150 hover:bg-surface-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/50 md:hidden"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <TbX size={17} />
              </button>
            </>
          )}

          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-500 outline-none transition-all duration-150 hover:bg-surface-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/50 md:flex"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <TbMenu2 size={16} />
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            NAVIGATION
        ══════════════════════════════════════════════════ */}
        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">

          {sidebarOpen && (
            <p
              className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              Navigation
            </p>
          )}

          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`group relative flex items-center rounded-xl outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3'
                  }`}
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(90deg, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.06) 100%)',
                          color: '#c7d2fe',
                          boxShadow:
                            '0 0 0 1px rgba(99,102,241,0.20) inset, 0 1px 0 0 rgba(255,255,255,0.04) inset',
                        }
                      : {
                          color: 'rgb(var(--text-muted))',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgb(var(--surface-800))';
                      e.currentTarget.style.color = 'rgb(var(--text-base))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(var(--text-muted))';
                    }
                  }}
                >
                  {isActive && sidebarOpen && (
                    <span className="pointer-events-none absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-300 to-primary-500 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                  )}

                  {isActive && !sidebarOpen && (
                    <span className="pointer-events-none absolute inset-1 rounded-xl ring-1 ring-primary-500/30" />
                  )}

                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center transition-all duration-200 group-hover:scale-[1.08] ${
                      isActive ? 'text-primary-300' : ''
                    }`}
                    style={
                      isActive
                        ? { filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.55))' }
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>

                  {sidebarOpen && (
                    <span className="truncate text-[13px] font-medium tracking-[-0.005em]">
                      {item.label}
                    </span>
                  )}

                  {isActive && sidebarOpen && (
                    <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════
            USER PROFILE
        ══════════════════════════════════════════════════ */}
        {user && (
          <div
            className="relative flex-shrink-0"
            style={{ borderTop: '1px solid rgb(var(--surface-800))' }}
          >
            {sidebarOpen ? (
              <div className="px-3 py-3">
                <div
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl p-2.5 transition-colors duration-150 hover:bg-surface-800/60"
                  title={`${user.name}\n${user.email}`}
                >
                  <div className="relative flex-shrink-0">
                    <span
                      className="absolute -inset-0.5 rounded-full opacity-70"
                      style={{
                        background:
                          'conic-gradient(from 90deg, rgba(129,140,248,0.6), rgba(99,102,241,0.15), rgba(129,140,248,0.6))',
                        filter: 'blur(4px)',
                      }}
                    />

                    <div
                      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[12.5px] font-semibold text-white ring-2 ring-surface-900"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(79,70,229) 0%, rgb(55,48,163) 100%)',
                      }}
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
                    </div>

                    <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-10 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-surface-900 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[12.5px] font-semibold tracking-[-0.005em]"
                      style={{ color: 'rgb(var(--text-base))' }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[10.5px]"
                      style={{ color: 'rgb(var(--text-muted))' }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-3">
                <div className="relative">
                  <span
                    className="absolute -inset-0.5 rounded-full opacity-70"
                    style={{
                      background:
                        'conic-gradient(from 90deg, rgba(129,140,248,0.6), rgba(99,102,241,0.15), rgba(129,140,248,0.6))',
                      filter: 'blur(3px)',
                    }}
                  />
                  <div
                    className="relative flex h-9 w-9 cursor-default items-center justify-center overflow-hidden rounded-full text-[12.5px] font-semibold text-white ring-2 ring-surface-900"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(79,70,229) 0%, rgb(55,48,163) 100%)',
                    }}
                    title={`${user.name}\n${user.email}`}
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
                  </div>
                  <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-10 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-surface-900 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SIGN OUT
        ══════════════════════════════════════════════════ */}
        <div
          className="relative flex-shrink-0"
          style={{ borderTop: '1px solid rgb(var(--surface-800))' }}
        >
          <div className="px-3 py-3">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className={`group flex w-full items-center rounded-xl text-red-400/90 outline-none transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40 ${
                sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3'
              }`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:scale-[1.08]">
                <TbLogout size={17} />
              </span>

              {sidebarOpen && (
                <span className="truncate text-[13px] font-medium">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}