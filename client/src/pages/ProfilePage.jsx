import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import {
  TbCamera,
  TbUser,
  TbLock,
  TbShieldCheck,
  TbMail,
} from 'react-icons/tb';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
  } = useForm();

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [selectedFile, setSelectedFile] = useState(null);

  /*
   * Keep local avatar state synchronized with the authenticated user.
   * This is important when the user data is restored after refresh/login.
   */
  useEffect(() => {
    if (!selectedFile) {
      setAvatar(user?.avatar || null);
    }
  }, [user?.avatar, selectedFile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      e.target.value = '';
      return;
    }

    // Keep avatar uploads reasonably sized on the client.
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(reader.result);
    };

    reader.onerror = () => {
      setAvatar(user?.avatar || null);
      setSelectedFile(null);
      toast.error('Unable to preview the selected image.');
    };

    reader.readAsDataURL(file);
  };

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);

    try {
      const payload = {
        name: data.name,
      };

      if (selectedFile) {
        payload.avatar = selectedFile;
      }

      const res = await userService.updateProfile(payload);

      const updatedUser = res.data?.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid profile response from server.');
      }

      // Update global authenticated user
      setUser(updatedUser);

      // Replace local preview with the permanent Cloudinary URL
      setAvatar(updatedUser.avatar || null);

      // Clear selected file because it has now been uploaded
      setSelectedFile(null);

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);

      /*
       * If upload failed, keep the currently saved avatar instead
       * of treating the temporary preview as a successful upload.
       */
      if (user?.avatar) {
        setAvatar(user.avatar);
      }

      setSelectedFile(null);

      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update profile.';

      toast.error(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data) => {
    setPasswordLoading(true);

    try {
      await userService.changePassword(data);

      toast.success('Password changed successfully!');
      resetPassword();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to change password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-surface-950">
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-5 sm:py-8 md:px-8 md:py-10 space-y-6 sm:space-y-8">

        {/* ── Page Header ─────────────────────────────────────── */}
        <header className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-1 rounded-full bg-primary-500" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-400">
              Account Settings
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">
            Profile
          </h1>

          <p className="mt-1.5 text-[13px] sm:text-sm text-surface-400 leading-relaxed break-words">
            Manage your personal information, avatar, and account security.
          </p>
        </header>

        {/* ── Layout Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3 md:gap-6">

          {/* ── Profile / Avatar Card ────────────────────────── */}
          <aside className="md:col-span-1 min-w-0">
            <div className="card relative overflow-hidden p-5 sm:p-6">

              {/* Top accent line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

              <div className="flex flex-col items-center text-center">

                {/* Avatar */}
                <div className="relative group">
                  <div className="relative h-[88px] w-[88px] sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden ring-1 ring-surface-800 shadow-2xl shadow-primary-950/40 transition-all duration-200 group-hover:ring-primary-500/40">

                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Camera FAB */}
                  <label
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface-900 border border-surface-700 text-surface-300 shadow-lg transition-all duration-150 hover:bg-primary-600 hover:border-primary-500 hover:text-white active:scale-90"
                    title="Change avatar"
                  >
                    <TbCamera size={14} />

                    <input
                      type="file"
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    />
                  </label>
                </div>

                {/* User info */}
                <div className="mt-5 w-full min-w-0">
                  <h2 className="truncate text-[15px] sm:text-base font-semibold text-white tracking-tight">
                    {user?.name || 'Unnamed User'}
                  </h2>

                  <div className="mt-1.5 flex items-center justify-center gap-1.5 min-w-0">
                    <TbMail size={12} className="flex-shrink-0 text-surface-500" />
                    <p className="truncate text-[11px] sm:text-xs text-surface-500">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 h-px w-full bg-surface-800/70" />

                {/* Meta row */}
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-2.5 py-1 mx-auto w-fit">
                    <TbShieldCheck size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                      Verified
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Helper text */}
            <p className="mt-3 px-1 text-center text-[10.5px] text-surface-600 leading-relaxed">
              Supported: JPG, PNG, WEBP, GIF · Max 5 MB
            </p>
          </aside>

          {/* ── Forms Column ─────────────────────────────────── */}
          <div className="md:col-span-2 min-w-0 space-y-5 sm:space-y-6">

            {/* ── Personal Information ─────────────────────── */}
            <section className="card relative overflow-hidden p-5 sm:p-6">

              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-surface-700/60 to-transparent" />

              <div className="flex items-start gap-3 min-w-0 mb-5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400">
                  <TbUser size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-white tracking-tight">
                    Personal Information
                  </h3>
                  <p className="mt-0.5 text-[11px] text-surface-500 leading-relaxed">
                    Update your display name and avatar.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmitProfile(onUpdateProfile)}
                className="space-y-5"
              >
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="name"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={
                      errorsProfile.name
                        ? 'input-error'
                        : 'input'
                    }
                    {...registerProfile('name', {
                      required: 'Name is required',
                    })}
                  />

                  {errorsProfile.name && (
                    <p className="error-text">
                      {errorsProfile.name.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <p className="text-[10.5px] text-surface-600 leading-relaxed order-2 sm:order-1">
                    Your name is visible to other room members.
                  </p>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="btn-primary w-full sm:w-auto sm:min-w-[150px] order-1 sm:order-2"
                  >
                    {profileLoading
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>

            </section>

            {/* ── Security ─────────────────────────────────── */}
            <section className="card relative overflow-hidden p-5 sm:p-6">

              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-surface-700/60 to-transparent" />

              <div className="flex items-start gap-3 min-w-0 mb-5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <TbLock size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-white tracking-tight">
                    Security
                  </h3>
                  <p className="mt-0.5 text-[11px] text-surface-500 leading-relaxed">
                    Keep your account protected with a strong password.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmitPassword(onChangePassword)}
                className="space-y-5"
              >
                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="currentPassword"
                  >
                    Current Password
                  </label>

                  <input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={
                      errorsPassword.currentPassword
                        ? 'input-error'
                        : 'input'
                    }
                    {...registerPassword('currentPassword', {
                      required:
                        'Current password is required',
                    })}
                  />

                  {errorsPassword.currentPassword && (
                    <p className="error-text">
                      {
                        errorsPassword.currentPassword
                          .message
                      }
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label
                    className="label"
                    htmlFor="newPassword"
                  >
                    New Password
                  </label>

                  <input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={
                      errorsPassword.newPassword
                        ? 'input-error'
                        : 'input'
                    }
                    {...registerPassword('newPassword', {
                      required:
                        'New password is required',
                      minLength: {
                        value: 6,
                        message:
                          'Password must be at least 6 characters',
                      },
                    })}
                  />

                  {errorsPassword.newPassword ? (
                    <p className="error-text">
                      {errorsPassword.newPassword.message}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[10.5px] text-surface-600 leading-relaxed">
                      Must be at least 6 characters long.
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <p className="text-[10.5px] text-surface-600 leading-relaxed order-2 sm:order-1">
                    You'll remain signed in on this device.
                  </p>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary w-full sm:w-auto sm:min-w-[170px] order-1 sm:order-2"
                  >
                    {passwordLoading
                      ? 'Updating...'
                      : 'Update Password'}
                  </button>
                </div>
              </form>

            </section>

          </div>
        </div>
      </div>
    </div>
  );
}