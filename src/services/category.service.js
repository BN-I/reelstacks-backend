const Category = require('../models/category.model');

const createCategory = async (categoryData) => {
  // Implementation for creating a category
  return Category.create(categoryData);
};

const queryCategories = async (filter, options) => {
  // Implementation for querying categories with filtering and pagination
  const categories = await Category.paginate(filter, options);
  return categories;
};

const getCategoryById = async (id) => {
  return Category.findById(id);
};

const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  await category.remove();
  return category;
};
module.exports = {
  createCategory,
  queryCategories,
  getCategoryById,
  deleteCategoryById,
};
