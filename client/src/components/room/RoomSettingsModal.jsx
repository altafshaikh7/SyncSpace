import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import { useRoomStore } from '../../store/roomStore';
import { TbChevronDown, TbCheck } from 'react-icons/tb';

const PRIVACY_OPTIONS = [
  {
    value: 'private',
    label: 'Private (Invite only)',
  },
  {
    value: 'public',
    label: 'Public (Anyone can discover)',
  },
];

const ACTIVE_MODE_OPTIONS = [
  {
    value: 'both',
    label: 'Whiteboard + Code Editor',
  },
  {
    value: 'whiteboard',
    label: 'Whiteboard Only',
  },
  {
    value: 'editor',
    label: 'Code Editor Only',
  },
];

function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`input w-full flex items-center justify-between text-left cursor-pointer ${
          open ? 'border-primary-500 ring-1 ring-primary-500' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedOption?.label}
        </span>

        <TbChevronDown
          size={18}
          className={`flex-shrink-0 text-surface-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-[100] mt-1 overflow-hidden rounded-lg border border-surface-700 bg-surface-800 shadow-2xl"
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left text-sm transition-colors ${
                  selected
                    ? 'bg-primary-600 text-white'
                    : 'text-surface-100 hover:bg-surface-700'
                }`}
                role="option"
                aria-selected={selected}
              >
                <span>{option.label}</span>

                {selected && (
                  <TbCheck
                    size={18}
                    className="flex-shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoomSettingsModal({
  isOpen,
  onClose,
  room,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: room?.name || '',
      description: room?.description || '',
      type: room?.type || 'private',
      activeMode: room?.activeMode || 'both',
    },
  });

  const [loading, setLoading] = useState(false);

  const [privacyType, setPrivacyType] = useState(
    room?.type || 'private'
  );

  const [activeMode, setActiveMode] = useState(
    room?.activeMode || 'both'
  );

  const { updateRoom } = useRoomStore();

  useEffect(() => {
    if (!room) return;

    const nextPrivacyType = room.type || 'private';
    const nextActiveMode = room.activeMode || 'both';

    reset({
      name: room.name || '',
      description: room.description || '',
      type: nextPrivacyType,
      activeMode: nextActiveMode,
    });

    setPrivacyType(nextPrivacyType);
    setActiveMode(nextActiveMode);
  }, [room, reset]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        ...data,
        type: privacyType,
        activeMode,
      };

      const res = await roomService.update(
        room._id,
        payload
      );

      updateRoom(
        room._id,
        res.data.data.room
      );

      toast.success(
        'Workspace updated successfully!'
      );

      onClose();
    } catch (err) {
      console.error(
        'Workspace update error:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          'Failed to update workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Workspace Settings
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Workspace Name */}
          <div>
            <label
              className="label"
              htmlFor="roomName"
            >
              Workspace Name
            </label>

            <input
              id="roomName"
              type="text"
              className={
                errors.name
                  ? 'input-error'
                  : 'input'
              }
              {...register('name', {
                required:
                  'Workspace name is required',
              })}
            />

            {errors.name && (
              <p className="error-text">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="label"
              htmlFor="description"
            >
              Description (Optional)
            </label>

            <textarea
              id="description"
              className="input h-20 resize-none"
              {...register('description')}
            />
          </div>

          {/* Privacy Type */}
          <CustomSelect
            id="privacyType"
            label="Privacy Type"
            value={privacyType}
            options={PRIVACY_OPTIONS}
            onChange={setPrivacyType}
          />

          {/* Active Mode */}
          <CustomSelect
            id="activeMode"
            label="Active Mode"
            value={activeMode}
            options={ACTIVE_MODE_OPTIONS}
            onChange={setActiveMode}
          />

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? 'Saving...'
                : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}