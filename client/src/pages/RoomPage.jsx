import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomService } from '../services';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import InviteMemberModal from '../components/room/InviteMemberModal';
import RoomSettingsModal from '../components/room/RoomSettingsModal';
import DocumentList from '../features/documents/DocumentList';
import FileList from '../features/files/FileList';
import { TbBrush, TbCode, TbUserPlus, TbSettings, TbHistory, TbUsers, TbTrash, TbCrown, TbLayoutColumns, TbLink, TbCopy, TbCheck, TbFileText, TbFolder } from 'react-icons/tb';
import toast from 'react-hot-toast';

export default function RoomPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentRoom, setCurrentRoom, members, setMembers } = useRoomStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyingRoomId, setCopyingRoomId] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, documents, files

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/room/${slug}/collaborate`;
    navigator.clipboard.writeText(link);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
    toast.success('Room link copied!');
  };

  const handleCopyRoomId = () => {
    const roomId = currentRoom?.slug || slug;
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopyingRoomId(true);
    setTimeout(() => setCopyingRoomId(false), 2000);
    toast.success('Room ID copied!');
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm('Are you sure you want to leave this workspace?')) return;
    try {
      await roomService.leave(currentRoom._id);
      toast.success('You have left the workspace.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace.');
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const res = await roomService.getBySlug(slug);
        const room = res.data.data.room;
        setCurrentRoom(room);
        setMembers(room.members);

        // Fetch Sessions
        const sRes = await roomService.getSessions(room._id);
        setSessions(sRes.data.data.sessions || []);
      } catch (err) {
        toast.error('Failed to load workspace.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, [slug, navigate, setCurrentRoom, setMembers]);

  const handleKick = async (targetUserId) => {
    try {
      await roomService.kickMember(currentRoom._id, targetUserId);
      setMembers(members.filter((m) => m.user._id !== targetUserId));
      toast.success('Member kicked.');
    } catch (err) {
      toast.error('Failed to kick member.');
    }
  };

  const handleTransfer = async (targetUserId) => {
    try {
      await roomService.transferOwnership(currentRoom._id, targetUserId);
      toast.success('Ownership transferred.');
      // Reload
      const res = await roomService.getBySlug(slug);
      setCurrentRoom(res.data.data.room);
    } catch (err) {
      toast.error('Failed to transfer ownership.');
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this workspace? This cannot be undone.')) return;
    try {
      await roomService.delete(currentRoom._id);
      toast.success('Workspace deleted.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete workspace.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="skeleton w-12 h-12 rounded-full animate-pulse bg-primary-600" />
        <p className="text-surface-400 text-sm">Loading workspace dashboard...</p>
      </div>
    );
  }

  if (!currentRoom) return null;

  const isOwner = currentRoom.owner._id === user._id;

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8 space-y-6 sm:space-y-8 animate-fade-in">

        {/* ── Header Banner ─────────────────────────────────── */}
        <section className="card relative overflow-hidden p-5 sm:p-6 md:p-8">

          {/* Top accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-600/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">

            {/* Left: title + meta */}
            <div className="min-w-0 flex-1 space-y-3">

              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                  {currentRoom.name}
                </h1>

                <span className="badge badge-primary flex-shrink-0">
                  {currentRoom.type}
                </span>
              </div>

              <p className="max-w-2xl break-words text-[12.5px] leading-relaxed text-surface-400 sm:text-sm">
                {currentRoom.description || 'No description provided.'}
              </p>

              {/* Room ID chip */}
              <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-surface-800 bg-surface-950/60 px-2.5 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-surface-500">
                  Room ID
                </span>

                <code className="truncate text-[11px] font-bold tracking-widest text-primary-300">
                  {currentRoom.slug}
                </code>

                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="flex-shrink-0 text-surface-500 transition-colors hover:text-white"
                  title="Copy Room ID"
                >
                  {copyingRoomId ? (
                    <TbCheck size={13} className="text-emerald-400" />
                  ) : (
                    <TbCopy size={13} />
                  )}
                </button>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:flex-shrink-0">

              <button
                type="button"
                onClick={() => navigate(`/room/${slug}/collaborate`)}
                className="btn-primary flex-1 justify-center whitespace-nowrap md:flex-none"
              >
                <TbLayoutColumns size={17} />
                <span>Open Space</span>
              </button>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="btn-secondary flex-1 justify-center whitespace-nowrap md:flex-none"
                title="Copy room link"
              >
                {copying ? <TbCheck size={17} className="text-emerald-400" /> : <TbLink size={17} />}
                <span className="hidden sm:inline">{copying ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {!isOwner && (
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="btn-danger flex-1 justify-center whitespace-nowrap md:flex-none"
                >
                  Leave Space
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="btn-secondary flex-shrink-0 p-2.5"
                  title="Workspace settings"
                >
                  <TbSettings size={17} />
                </button>
              )}

            </div>
          </div>
        </section>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <nav className="min-w-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 border-b border-surface-800 min-w-max sm:min-w-0">

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors sm:px-4 sm:text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-surface-400 hover:text-white'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors sm:px-4 sm:text-sm ${
                activeTab === 'documents'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-surface-400 hover:text-white'
              }`}
            >
              <TbFileText size={15} />
              Documents
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors sm:px-4 sm:text-sm ${
                activeTab === 'files'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-surface-400 hover:text-white'
              }`}
            >
              <TbFolder size={15} />
              Files
            </button>

          </div>
        </nav>

        {/* ── Overview Tab ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8 min-w-0">

            {/* ── Members Panel ───────────────────────────── */}
            <div className="min-w-0 space-y-4 lg:col-span-1">

              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <TbUsers size={18} className="flex-shrink-0 text-primary-500" />
                  <h2 className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base">
                    Members
                  </h2>
                  <span className="flex-shrink-0 rounded-full bg-surface-800 px-1.5 py-0.5 text-[10px] font-semibold text-surface-400">
                    {members.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="btn-secondary btn-sm flex-shrink-0"
                >
                  <TbUserPlus size={14} />
                  <span className="hidden xs:inline sm:inline">Invite</span>
                </button>
              </div>

              <div className="card p-3 sm:p-4 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">

                <div className="divide-y divide-surface-800/60">
                  {members.map((member) => (
                    <div
                      key={member.user._id}
                      className="group flex min-w-0 items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >

                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-700 to-primary-900 text-xs font-bold text-white ring-1 ring-primary-500/20 sm:h-10 sm:w-10 sm:text-sm">
                            {member.user.avatar ? (
                              <img
                                src={member.user.avatar}
                                alt={member.user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              member.user.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          {member.user.isOnline && (
                            <span className="online-dot" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-white sm:text-sm">
                            <span className="truncate">{member.user.name}</span>
                            {member.role === 'owner' && (
                              <TbCrown className="flex-shrink-0 text-yellow-400" size={13} />
                            )}
                          </p>
                          <p className="truncate text-[11px] text-surface-500">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {isOwner && member.user._id !== user._id && (
                        <div className="flex flex-shrink-0 items-center gap-0.5 rounded-lg border border-surface-800/80 bg-surface-950/60 p-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleTransfer(member.user._id)}
                            title="Transfer Ownership"
                            className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-800 hover:text-yellow-400"
                          >
                            <TbCrown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKick(member.user._id)}
                            title="Kick Member"
                            className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <TbTrash size={13} />
                          </button>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ── Sessions Panel ──────────────────────────── */}
            <div className="min-w-0 space-y-4 lg:col-span-2">

              <div className="flex min-w-0 items-center gap-2">
                <TbHistory size={18} className="flex-shrink-0 text-primary-500" />
                <h2 className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base">
                  Recent Sessions
                </h2>
              </div>

              <div className="card p-3 sm:p-4 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">

                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-800 bg-surface-900/60">
                      <TbHistory size={20} className="text-surface-500" />
                    </div>
                    <p className="text-[12.5px] font-medium text-surface-400 sm:text-sm">
                      No recorded sessions yet
                    </p>
                    <p className="max-w-xs text-[11px] leading-relaxed text-surface-600">
                      The workspace owner can start a recording from the collaboration space.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-800/60">
                    {sessions.map((session) => (
                      <div
                        key={session._id}
                        className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold text-white sm:text-sm">
                            Recorded by{' '}
                            <span className="text-surface-200">{session.startedBy.name}</span>
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-surface-500">
                            {new Date(session.startedAt).toLocaleDateString()} · {new Date(session.startedAt).toLocaleTimeString()}
                          </p>

                          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-surface-800 bg-surface-950/60 px-2 py-0.5">
                            <span className="h-1 w-1 rounded-full bg-primary-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                              {session.duration
                                ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
                                : 'Ongoing'}
                            </span>
                          </div>
                        </div>

                        {session.endedAt && (
                          <Link
                            to={`/room/${slug}/replay/${session._id}`}
                            className="btn-secondary btn-sm flex-shrink-0 justify-center self-start sm:self-auto"
                          >
                            View Replay
                          </Link>
                        )}

                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* ── Documents Tab ────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="min-w-0">
            <DocumentList roomId={currentRoom._id} isOwner={isOwner} slug={slug} />
          </div>
        )}

        {/* ── Files Tab ────────────────────────────────────── */}
        {activeTab === 'files' && (
          <div className="min-w-0">
            <FileList roomId={currentRoom._id} isOwner={isOwner} />
          </div>
        )}

        {/* ── Danger Zone ──────────────────────────────────── */}
        {isOwner && activeTab === 'overview' && (
          <section className="card relative overflow-hidden border-red-900/30 bg-red-950/[0.06] p-5 sm:p-6">

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-red-400 sm:text-sm">
                    Danger Zone
                  </h3>
                </div>

                <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-surface-500">
                  Once you delete this workspace, there is no going back. All drawing snapshots, replay logs, and configs will be lost.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteRoom}
                className="btn-danger btn-sm flex-shrink-0 justify-center self-start md:self-auto"
              >
                Delete Workspace
              </button>

            </div>
          </section>
        )}

      </div>

      <InviteMemberModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} roomId={currentRoom._id} />
      <RoomSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} room={currentRoom} />
    </div>
  );
}