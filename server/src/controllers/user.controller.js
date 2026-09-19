const userService = require('../services/user.service');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(
    req.user.id,
    req.body,
    req.file
  );

  res.json({
    success: true,
    data: { user },
  });
});

const changePassword = catchAsync(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

const getActivityLog = catchAsync(async (req, res) => {
  const logs = await userService.getActivityLog(
    req.user.id,
    req.query
  );

  res.json({
    success: true,
    data: { logs },
  });
});

const deleteActivityLog = catchAsync(async (req, res) => {
  const { activityId } = req.params;

  if (!activityId) {
    throw new AppError('Activity ID is required.', 400);
  }

  const deletedActivity = await ActivityLog.findOneAndDelete({
    _id: activityId,
    user: req.user.id,
  });

  if (!deletedActivity) {
    throw new AppError(
      'Activity not found or you are not allowed to delete it.',
      404
    );
  }

  res.json({
    success: true,
    message: 'Activity deleted successfully.',
    data: {
      activityId,
    },
  });
});

const searchUsers = catchAsync(async (req, res) => {
  const users = await userService.searchUsers(req.query.q);

  res.json({
    success: true,
    data: { users },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getActivityLog,
  deleteActivityLog,
  searchUsers,
};