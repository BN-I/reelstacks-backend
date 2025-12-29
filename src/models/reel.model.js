const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const reelSchema = mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
    },
    folder: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Folder',
      required: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
reelSchema.plugin(toJSON);
reelSchema.plugin(paginate);

/**
 * @typedef Token
 */
const Reel = mongoose.model('reel', reelSchema);

module.exports = Reel;
