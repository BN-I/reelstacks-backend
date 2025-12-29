const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { categoryValidation } = require('../../validations');
const { categoryController } = require('../../controllers');
const router = express.Router();

router
  .route('/')
  .post(auth('manageCategories'), validate(categoryValidation.createCategory), categoryController.createCategory)
  .get(auth('getCategories'), categoryController.getCategories);

router
  .route('/:categoryId')
  .get(auth('getCategories'), validate(categoryValidation.getCategory), categoryController.getCategory)
  .delete(auth('manageCategories'), validate(categoryValidation.deleteCategory), categoryController.deleteCategory);

module.exports = router;
