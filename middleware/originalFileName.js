const multer = require('multer');
const path = require('path');

// Set up storage with Multer to retain original filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Retain original filename
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
