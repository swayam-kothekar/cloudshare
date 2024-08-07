const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadFile } = require('./upload');
const { downloadFile } = require('./download');

const app = express();
const port = 3000; // Change to your preferred port

app.use(bodyParser.json());

// Upload file endpoint
app.post('/upload', upload.single('file'), uploadFile);

// Download file endpoint
app.get('/download', downloadFile);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
