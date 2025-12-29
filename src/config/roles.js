const allRoles = {
  user: ['getCategories', 'getReels', 'manageReels', 'getFolders', 'manageFolders', 'onBoardingCompleted'],
  admin: [
    'getUsers',
    'manageUsers',
    'getCategories',
    'manageCategories',
    'getReels',
    'manageReels',
    'getFolders',
    'manageFolders',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
