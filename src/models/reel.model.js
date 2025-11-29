const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const reelSchema = mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    folder: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Folder',
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

/**
 * @typedef Token
 */
const Reel = mongoose.model('reelSchema', reelSchema);

module.exports = Reel;
