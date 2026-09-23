const multer = require('multer')
const path = require('path')
const fs = require('fs')

// ============================================================
// ORDER IMAGE UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
  __dirname,
  '../uploads/orders'
)

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  })
}

// ============================================================
// STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory)
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase()

    const filename =
      `order-${Date.now()}-${Math.round(
        Math.random() * 1000000000
      )}${extension}`

    cb(null, filename)
  },
})

// ============================================================
// ALLOWED IMAGE TYPES
// ============================================================

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        'Only JPG, JPEG, PNG and WEBP images are allowed'
      )
    )
  }

  cb(null, true)
}

// ============================================================
// MULTER
// Maximum image size = 5 MB
// ============================================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

module.exports = upload