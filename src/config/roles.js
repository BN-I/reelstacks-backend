const allRoles = {
  user: ['getCategories', 'getReels', 'manageReels', 'getMyFolders', 'manageFolders', 'onBoardingCompleted'],
  admin: [
    'getUsers',
    'manageUsers',
    'getCategories',
    'manageCategories',
    'getAllReels',
    'getReels',
    'manageReels',
    'getFolders',
    'manageFolders',
    'getAnalytics',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
