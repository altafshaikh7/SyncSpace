import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';
import { chatService } from '../../services';
import {
  TbSend,
  TbArrowBackUp,
  TbTrash,
  TbMoodSmile,
  TbMessageCircle,
  TbX,
} from 'react-icons/tb';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

export default function ChatPanel() {
  const { messages, setMessages, addMessage, removeMessage, typingUsers, reset } =
    useChatStore();

  const { currentRoom } = useRoomStore();

  const {
    emitChatMessage,
    emitChatSeen,
    emitTypingStart,
    emitTypingStop,
  } = useSocket();

  const { user } = useAuthStore();

  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentRoom) return;

    emitChatSeen(currentRoom._id);

    return () => {};
  }, [currentRoom?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    emitChatMessage(
      currentRoom._id,
      content,
      'text',
      replyTo?._id
    );

    setContent('');
    setReplyTo(null);
    setEmojiOpen(false);

    emitTypingStop(currentRoom._id);
  };

  const handleInputChange = (e) => {
    setContent(e.target.value);

    emitTypingStart(currentRoom._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(currentRoom._id);
    }, 2000);
  };

  const handleDelete = async (msgId) => {
    try {
      await chatService.deleteMessage(msgId);
      removeMessage(msgId);
    } catch (err) {
      toast.error('Failed to delete message.');
    }
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-surface-950 border-l border-surface-800/70">

      {/* ================= HEADER ================= */}
      <div className="relative flex flex-shrink-0 items-center justify-between gap-3 border-b border-surface-800/70 bg-gradient-to-b from-surface-900/95 to-surface-900/70 px-4 py-3.5 backdrop-blur-xl">

        {/* Subtle top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="flex min-w-0 items-center gap-3">

          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary-500/25 bg-gradient-to-br from-primary-600/30 via-primary-600/10 to-transparent shadow-lg shadow-primary-950/40">
            <TbMessageCircle
              size={18}
              className="text-primary-300"
            />

            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-[2.5px] ring-surface-900" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold tracking-tight text-white">
              Live Room Chat
            </h3>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <p className="truncate text-[10.5px] font-medium text-surface-500">
                {currentRoom?.name
                  ? `${currentRoom.name} · Active now`
                  : 'Real-time conversation'}
              </p>
            </div>
          </div>

        </div>

        <div className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-400/90">
            Live
          </span>
        </div>

      </div>

      {/* ================= MESSAGES ================= */}
      <div className="relative flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin scrollbar-thumb-surface-700/60 scrollbar-track-transparent">

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">

            <div className="relative mb-5">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-primary-500/10 blur-2xl" />

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-800/90 bg-gradient-to-br from-surface-900 to-surface-950 shadow-2xl shadow-black/40">
                <TbMessageCircle
                  size={26}
                  className="text-surface-600"
                />
              </div>
            </div>

            <p className="text-sm font-semibold tracking-tight text-surface-200">
              No messages yet
            </p>

            <p className="mt-1.5 max-w-[240px] text-xs leading-5 text-surface-500">
              Start the conversation and collaborate with your team in real time.
            </p>

          </div>
        ) : (
          <div className="space-y-0.5">

            {messages.map((msg) => {
              const isSystem = msg.type === 'system';

              if (isSystem) {
                return (
                  <div
                    key={msg._id}
                    className="my-3.5 flex items-center gap-2.5"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-surface-800 to-surface-800/40" />

                    <span className="rounded-full border border-surface-800/90 bg-surface-900/70 px-3 py-1 text-[10px] font-medium tracking-wide text-surface-500 backdrop-blur">
                      {msg.content}
                    </span>

                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-surface-800 to-surface-800/40" />
                  </div>
                );
              }

              return (
                <div
                  key={msg._id}
                  className="group relative rounded-xl px-2.5 py-2 transition-colors duration-150 hover:bg-surface-900/50"
                >

                  {/* Reply context */}
                  {msg.replyTo && (
                    <div className="ml-11 mb-2 flex max-w-[calc(100%-44px)] items-center gap-2 rounded-lg border-l-2 border-primary-500/60 bg-gradient-to-r from-surface-900/90 to-surface-900/40 px-3 py-1.5">

                      <TbArrowBackUp
                        size={11}
                        className="flex-shrink-0 text-primary-400/80"
                      />

                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-semibold tracking-wide text-primary-400">
                          {msg.replyTo.sender.name}
                        </div>

                        <div className="truncate text-[11px] leading-4 text-surface-500">
                          {msg.replyTo.content}
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="flex items-start gap-3">

                    {/* Avatar */}
                    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-600/40 via-primary-700/20 to-primary-900/10 text-xs font-semibold text-primary-200 shadow-md shadow-black/20 ring-1 ring-primary-500/20">

                      {msg.sender.avatar ? (
                        <img
                          src={msg.sender.avatar}
                          alt={msg.sender.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        msg.sender.name?.charAt(0)?.toUpperCase()
                      )}

                    </div>

                    {/* Message */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-baseline gap-2">

                        <span className="truncate text-[12.5px] font-semibold tracking-tight text-surface-100">
                          {msg.sender.name}
                        </span>

                        <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-surface-600">
                          {new Date(msg.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>

                      </div>

                      <div className="mt-1 flex items-start gap-2">

                        <p
                          className={`break-words text-[13px] leading-[1.6] ${
                            msg.isDeleted
                              ? 'italic text-surface-600 line-through decoration-surface-700/80 decoration-1'
                              : 'text-surface-300'
                          }`}
                        >
                          {msg.content}
                        </p>

                      </div>

                    </div>

                    {/* Actions */}
                    {!msg.isDeleted && (
                      <div className="pointer-events-none absolute right-3 top-2 flex flex-shrink-0 items-center gap-0.5 rounded-lg border border-surface-800/90 bg-surface-900/95 p-0.5 opacity-0 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100">

                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          className="rounded-md p-1.5 text-surface-400 transition-all duration-100 hover:bg-surface-800 hover:text-white active:scale-90"
                          title="Reply"
                        >
                          <TbArrowBackUp size={13} />
                        </button>

                        {(msg.sender._id === user?._id ||
                          msg.sender._id === user?.id) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(msg._id)}
                            className="rounded-md p-1.5 text-surface-400 transition-all duration-100 hover:bg-red-500/10 hover:text-red-400 active:scale-90"
                            title="Delete Message"
                          >
                            <TbTrash size={13} />
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* ================= TYPING INDICATOR ================= */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 border-t border-surface-800/50 bg-surface-950/85 px-4 py-2 backdrop-blur">

          <div className="flex items-center gap-2.5">

            <div className="flex items-center gap-0.5 rounded-full border border-surface-800/80 bg-surface-900/70 px-2 py-1">
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary-400" />
              <span
                className="h-1 w-1 animate-bounce rounded-full bg-primary-400"
                style={{ animationDelay: '120ms' }}
              />
              <span
                className="h-1 w-1 animate-bounce rounded-full bg-primary-400"
                style={{ animationDelay: '240ms' }}
              />
            </div>

            <span className="truncate text-[11px] font-medium text-surface-500">
              {typingUsers.map((u) => u.name).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>

          </div>

        </div>
      )}

      {/* ================= COMPOSER ================= */}
      <form
        onSubmit={handleSend}
        className="relative flex-shrink-0 border-t border-surface-800/70 bg-gradient-to-b from-surface-900/60 to-surface-900/90 p-3 backdrop-blur-xl"
      >

        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-surface-800/80 bg-surface-950/80 px-3 py-2.5 shadow-inner">

            <div className="flex min-w-0 items-center gap-2.5">

              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/12 text-primary-400 ring-1 ring-primary-500/20">
                <TbArrowBackUp size={13} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold tracking-wide text-primary-400">
                  Replying to {replyTo.sender.name}
                </p>

                <p className="truncate text-[11px] leading-4 text-surface-500">
                  {replyTo.content}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-surface-500 transition-all duration-100 hover:bg-surface-800 hover:text-white active:scale-90"
              title="Cancel reply"
            >
              <TbX size={14} />
            </button>

          </div>
        )}

        <div className="relative flex items-end gap-1.5 rounded-2xl border border-surface-800/80 bg-surface-950/90 p-1.5 shadow-inner transition-all duration-150 focus-within:border-primary-500/40 focus-within:ring-2 focus-within:ring-primary-500/10">

          {/* Emoji */}
          <button
            type="button"
            onClick={() => setEmojiOpen(!emojiOpen)}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 active:scale-90 ${
              emojiOpen
                ? 'bg-primary-500/15 text-primary-400'
                : 'text-surface-500 hover:bg-surface-800/80 hover:text-surface-200'
            }`}
            title="Emoji"
          >
            <TbMoodSmile size={19} />
          </button>

          {/* Emoji Picker */}
          {emojiOpen && (
            <div className="absolute bottom-14 left-0 z-50 overflow-hidden rounded-xl border border-surface-700/80 shadow-2xl shadow-black/60">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme="dark"
                width={320}
                height={400}
              />
            </div>
          )}

          {/* Input */}
          <input
            type="text"
            placeholder="Message your team..."
            value={content}
            onChange={handleInputChange}
            className="min-w-0 flex-1 border-none bg-transparent px-1.5 py-2 text-[13px] text-surface-200 outline-none placeholder:text-surface-600"
          />

          {/* Send */}
          <button
            type="submit"
            disabled={!content.trim()}
            className="group flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-950/40 transition-all duration-150 hover:from-primary-400 hover:to-primary-500 hover:shadow-primary-900/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25 disabled:shadow-none"
            title="Send message"
          >
            <TbSend
              size={15}
              className="transition-transform duration-150 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
            />
          </button>

        </div>

        <div className="mt-1.5 flex items-center justify-between px-1.5">
          <span className="text-[9.5px] font-medium tracking-wide text-surface-600">
            Press <kbd className="rounded border border-surface-800 bg-surface-900 px-1 py-px font-sans text-[9px] text-surface-500">Enter</kbd> to send
          </span>

          {content.length > 0 && (
            <span className="text-[9.5px] font-medium tabular-nums text-surface-600">
              {content.length}
            </span>
          )}
        </div>

      </form>

    </div>
  );
}