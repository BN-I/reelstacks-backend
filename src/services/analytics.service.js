const { User, Reel, Folder } = require('../models');

// Helper: Get growth array for past 12 months
function getGrowthArr(items, dateField, monthLabels, labelKey) {
  const growth = Array(12).fill(0);
  items.forEach((item) => {
    const createdAt = new Date(item[dateField]);
    for (let i = 0; i < 12; i++) {
      if (createdAt.getFullYear() === monthLabels[i].year && createdAt.getMonth() === monthLabels[i].month) {
        growth[i]++;
        break;
      }
    }
  });
  return growth.map((count, idx) => ({
    month: monthLabels[idx].label,
    [labelKey]: count,
  }));
}

// Helper: Get platform breakdown for reels
function getPlatformBreakdown(reels) {
  const platforms = {
    facebook: ['facebook.com', 'fb.watch'],
    youtube: ['youtube.com', 'youtu.be'],
    instagram: ['instagram.com', 'instagr.am'],
    tiktok: ['tiktok.com'],
    twitter: ['twitter.com', 'x.com'],
    linkedin: ['linkedin.com'],
    snapchat: ['snapchat.com'],
    pinterest: ['pinterest.com'],
    reddit: ['reddit.com'],
    vimeo: ['vimeo.com'],
    dailymotion: ['dailymotion.com'],
    twitch: ['twitch.tv'],
    threads: ['threads.net'],
  };
  const platformBreakdown = {};
  Object.keys(platforms).forEach((key) => {
    platformBreakdown[key] = 0;
  });
  reels.forEach((reel) => {
    if (!reel.url) return;
    for (const [platform, patterns] of Object.entries(platforms)) {
      if (patterns.some((pattern) => reel.url.includes(pattern))) {
        platformBreakdown[platform]++;
        break;
      }
    }
  });
  return platformBreakdown;
}

const getAnalytics = async () => {
  try {
    const [users, reels, folders] = await Promise.all([User.find(), Reel.find(), Folder.find()]);

    const totalUsers = users.length;
    const inactiveUsers = users.filter((user) => !user.isActive).length;
    const activeUsers = users.length - inactiveUsers;
    const today = new Date();
    const todayUsers = users.filter((user) => {
      const userDate = new Date(user.createdAt);
      return userDate.toDateString() === today.toDateString();
    })?.length;

    const totalReels = reels.length;
    const reelsToday = reels.filter((reel) => {
      const reelDate = new Date(reel.createdAt);
      return reelDate.toDateString() === today.toDateString();
    })?.length;

    const totalFolder = folders.length;

    // Month labels for past 12 months
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthLabels = [];
    const now = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push({
        label: months[d.getMonth()] + ' ' + d.getFullYear(),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    const userGrowth = getGrowthArr(users, 'createdAt', monthLabels, 'users');
    const reelGrowth = getGrowthArr(reels, 'createdAt', monthLabels, 'reels');
    const folderGrowth = getGrowthArr(folders, 'createdAt', monthLabels, 'folders');
    const platformBreakdown = getPlatformBreakdown(reels);

    return {
      totalUsers,
      todayUsers,
      activeUsers,
      inactiveUsers,
      totalReels,
      reelsToday,
      totalFolder,
      userGrowth,
      reelGrowth,
      folderGrowth,
      platformBreakdown,
    };
  } catch (error) {
    // Log error and rethrow or return a safe object
    console.error('Error in getAnalytics:', error);
    throw error;
  }
};

module.exports = {
  getAnalytics,
};
