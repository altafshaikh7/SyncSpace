const User = require('../models/User');
const Room = require('../models/Room');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');
const cloudinary = require('../config/cloudinary');

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId).populate(
      'rooms',
      'name slug type lastActivity'
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.toPublicJSON();
  }

  async updateProfile(userId, data, file) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update basic profile information
    if (data.name) {
      user.name = data.name;
    }

    if (data.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...data.notificationPreferences,
      };
    }

    /*
     * Avatar update flow:
     * 1. Upload the new avatar first.
     * 2. Save the new Cloudinary URL/public ID in MongoDB.
     * 3. Delete the old Cloudinary image only after successful save.
     *
     * This prevents the existing avatar from being deleted if
     * the new Cloudinary upload fails.
     */
    if (file) {
      const oldAvatarPublicId = user.avatarPublicId;

      let result;

      try {
        result = await uploadToCloudinary(
          file.buffer,
          'avatars',
          {
            resource_type: 'image',
            transformation: [
              {
                width: 200,
                height: 200,
                crop: 'fill',
                gravity: 'face',
              },
            ],
          }
        );
      } catch (err) {
        console.error(
          'Cloudinary avatar upload failed:',
          err.message || err
        );

        throw new AppError(
          'Avatar upload failed. Please check your Cloudinary configuration and permissions.',
          500
        );
      }

      // Update MongoDB with the newly uploaded avatar
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;

      try {
        await user.save();
      } catch (err) {
        // If MongoDB save fails after Cloudinary upload,
        // try to remove the newly uploaded Cloudinary asset
        // so we do not leave an orphaned file.
        try {
          if (result.public_id) {
            await cloudinary.uploader.destroy(result.public_id);
          }
        } catch (cleanupError) {
          console.warn(
            'Failed to clean up new Cloudinary avatar after MongoDB error:',
            cleanupError.message || cleanupError
          );
        }

        throw err;
      }

      // Delete the previous avatar only after the new one
      // has successfully been uploaded and saved in MongoDB.
      if (oldAvatarPublicId && oldAvatarPublicId !== result.public_id) {
        try {
          await cloudinary.uploader.destroy(oldAvatarPublicId);
        } catch (err) {
          // Old avatar cleanup failure should not make the
          // profile update fail because the new avatar is already valid.
          console.warn(
            'Failed to delete old Cloudinary avatar:',
            err.message || err
          );
        }
      }

      return user.toPublicJSON();
    }

    // Save normal profile changes when no avatar was uploaded.
    await user.save();

    return user.toPublicJSON();
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();
  }

  async getActivityLog(userId, { page = 1, limit = 20 } = {}) {
    const skip = (Number(page) - 1) * Number(limit);

    return ActivityLog.find({ user: userId })
      .populate('room', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
  }

  async searchUsers(query) {
    if (!query || query.length < 2) {
      return [];
    }

    return User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email avatar isOnline')
      .limit(10);
  }
}

module.exports = new UserService();