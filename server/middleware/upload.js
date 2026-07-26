const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Buffer in memory first — sharp needs the raw bytes, and we only write the
// final, resized/compressed file to disk once, rather than writing the
// original and then overwriting it.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Resizes/compresses the uploaded image to a sane max size and re-encodes it
// as JPEG (except GIFs, which we leave alone so animation isn't destroyed).
// Runs after multer.single(...); populates req.file.filename/path just like
// disk storage would, so downstream controllers don't need to change.
const processImage = (fieldName) => async (req, res, next) => {
  if (!req.file) return next();

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === '.gif') {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.gif`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      req.file.filename = filename;
      req.file.path = path.join(uploadDir, filename);
      return next();
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .rotate() // respect EXIF orientation
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outputPath);

    req.file.filename = filename;
    req.file.path = outputPath;
    next();
  } catch (err) {
    next(err);
  }
};

// Convenience: multer + image processing chained for a given field name.
const uploadImage = (fieldName) => [upload.single(fieldName), processImage(fieldName)];

module.exports = upload;
module.exports.uploadImage = uploadImage;
module.exports.processImage = processImage;
