const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const reelValidation = require('../../validations/reel.validation');
const reelController = require('../../controllers/reel.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageReels'), validate(reelValidation.createReel), reelController.createReel)
  .get(auth('getReels'), validate(reelValidation.getReels), reelController.getReels);

// Route to delete many reels belonging to the user
router.delete('/delete-many', auth('manageReels'), validate(reelValidation.deleteManyReels), reelController.deleteManyReels);

router
  .route('/:reelId')
  .get(auth('getReels'), validate(reelValidation.getReel), reelController.getReel)
  .delete(auth('manageReels'), validate(reelValidation.deleteReel), reelController.deleteReel);

router
  .route('/folder/:folderId')
  .get(auth('getReels'), validate(reelValidation.getReelsByFolder), reelController.getReelsByFolder);

module.exports = router;

/**
 * @swagger
 * /reels/delete-many:
 *   post:
 *     summary: Delete many reels
 *     description: Delete multiple reels belonging to the authenticated user.
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reelIds
 *             properties:
 *               reelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of reel IDs to delete
 *             example:
 *               reelIds: ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
 *     responses:
 *       "200":
 *         description: Successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * tags:
 *   name: Reels
 *   description: Reel management and retrieval
 *
 * /reels:
 *   post:
 *     summary: Create a reel
 *     description: Upload a new reel record (URL, image id, folder id, title).
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - image
 *               - folder
 *               - title
 *             properties:
 *               url:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: Image (user) id
 *               folder:
 *                 type: string
 *                 description: Folder id
 *               title:
 *                 type: string
 *             example:
 *               url: https://example.com/video.mp4
 *               image: 60d0fe4f5311236168a109ca
 *               folder: 60d0fe4f5311236168a109cb
 *               title: My reel
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reel'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all reels
 *     description: Retrieve reels with optional filters.
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Reel title
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Filter by folder id
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. title:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of reels
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reel'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 * /reels/{id}:
 *   get:
 *     summary: Get a reel
 *     description: Retrieve a single reel by id.
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reel'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a reel
 *     description: Update reel fields. Requires at least one field in body.
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               image:
 *                 type: string
 *               folder:
 *                 type: string
 *               title:
 *                 type: string
 *             example:
 *               title: Updated title
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reel'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a reel
 *     description: Delete a reel by id.
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
