const mongoose = require('mongoose');

// A snapshot of a post's content taken just before each edit, so authors can
// see (and in principle roll back to) an earlier version.
const postRevisionSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    title: String,
    content: String,
    category: String,
    tags: [String],
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PostRevision', postRevisionSchema);
