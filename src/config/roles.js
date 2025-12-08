const allRoles = {
  user: ['getReels', 'manageReels', 'getFolders', 'manageFolders'],
  admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
