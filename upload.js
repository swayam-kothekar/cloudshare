// // const AWS = require('./awsConfig');
// // const fs = require('fs');
// // const path = require('path');
// // const crypto = require('crypto');
// // const { v4: uuidv4 } = require('uuid');

// // const algorithm = 'aes-128-cbc'; // Using CBC mode for better security
// // const key = crypto.randomBytes(16); // AES-256 requires a 256-bit key (32 bytes)
// // const iv = crypto.randomBytes(16);  // Initialization vector for AES

// // // Create an S3 service object
// // const s3 = new AWS.S3();

// // const encryptFile = (filePath) => {
// //   const fileContent = fs.readFileSync(filePath);
// //   const cipher = crypto.createCipheriv(algorithm, key, iv);

// //   // Get the original file extension and prepend it to the file content
// //   const extension = path.extname(filePath);
// //   const fileContentWithExt = Buffer.concat([Buffer.from(extension + '\0'), fileContent]);

// //   let encrypted = cipher.update(fileContentWithExt);
// //   encrypted = Buffer.concat([encrypted, cipher.final()]);
// //   return encrypted;
// // };

// // const uploadFile = (filePath, bucketName) => {
// //   const encryptedContent = encryptFile(filePath);

// //   // Generate a unique key using UUID
// //   const fileName = path.basename(filePath, path.extname(filePath));
// //   const keyName = `${uuidv4()}-${fileName}.encrypted`;

// //   // Setting up S3 upload parameters
// //   const params = {
// //     Bucket: bucketName,
// //     Key: keyName,
// //     Body: encryptedContent,
// //   };

// //   // Uploading files to the bucket
// //   s3.upload(params, (err, data) => {
// //     if (err) {
// //       console.error(`File upload failed. ${err.message}`);
// //       return;
// //     }
// //     console.log(`File uploaded successfully at ${data.Location}`);

// //     // Generate a pre-signed URL for the uploaded file
// //     const urlParams = {
// //       Bucket: bucketName,
// //       Key: keyName,
// //       Expires: 60 * 5  // URL expires in 5 minutes
// //     };

// //     const url = s3.getSignedUrl('getObject', urlParams);
// //     console.log(`The URL for downloading the encrypted file is ${url}`);

// //     // Log the encryption key and IV (in a real-world scenario, you would handle this securely)
// //     console.log('Encryption Key:', key.toString('hex'));
// //     console.log('Initialization Vector:', iv.toString('hex'));
// //   });
// // };

// // // Example usage
// // const filePath = 'OUTPUT.png';
// // const bucketName = 'cloudshare1';

// // uploadFile(filePath, bucketName);



// const AWS = require('./awsConfig');
// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
// const { v4: uuidv4 } = require('uuid');

// const algorithm = 'aes-128-cbc';
// const key = crypto.randomBytes(16); // 128-bit key (16 bytes)
// const iv = crypto.randomBytes(16);  // Initialization vector for AES

// const s3 = new AWS.S3();

// const encryptFile = (filePath) => {
//   const fileContent = fs.readFileSync(filePath);
//   const cipher = crypto.createCipheriv(algorithm, key, iv);

//   const extension = path.extname(filePath);
//   const fileContentWithExt = Buffer.concat([Buffer.from(extension + '\0'), fileContent]);

//   let encrypted = cipher.update(fileContentWithExt);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return encrypted;
// };

// const uploadFile = (req, res) => {
//   const file = req.file;
//   const filePath = file.path;
//   const encryptedContent = encryptFile(filePath);

//   const fileName = path.basename(filePath, path.extname(filePath));
//   const keyName = `${uuidv4()}-${fileName}.encrypted`;

//   const params = {
//     Bucket: 'cloudshare1',
//     Key: keyName,
//     Body: encryptedContent,
//   };

//   s3.upload(params, (err, data) => {
//     if (err) {
//       console.error(`File upload failed. ${err.message}`);
//       res.status(500).send({ error: err.message });
//       return;
//     }
//     console.log(`File uploaded successfully at ${data.Location}`);

//     const urlParams = {
//       Bucket: 'cloudshare1',
//       Key: keyName,
//       Expires: 60 * 5
//     };

//     const signedUrl = s3.getSignedUrl('getObject', urlParams);

//     const getPresignedUrlParams = (signedUrl) => {
//       const urlObj = new URL(signedUrl);
//       const params = urlObj.searchParams;
      
//       const AWSAccessKeyId = params.get('AWSAccessKeyId');
//       const Expires = params.get('Expires');
//       const Signature = params.get('Signature');
    
//       return { AWSAccessKeyId, Expires, Signature };
//     };

//     const { AWSAccessKeyId, Expires, Signature } = getPresignedUrlParams(signedUrl)
//     console.table(Signature)



//     const url = `http://localhost:3001/download?keyName=${keyName}&AWSAccessKeyId=${AWSAccessKeyId}&Expires=${Expires}&Signature=${Signature}&key=${key.toString('base64')}&iv=${iv.toString('base64')}`
//     console.log(`The URL for downloading the encrypted file is ${url}`);

//     res.status(200).send({
//       message: 'File uploaded successfully!',
//       downloadUrl: url
//     });
//   });
// };

// module.exports = { uploadFile };




const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const algorithm = 'aes-128-cbc';


// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const encryptFile = (filePath, key, iv) => {
  const fileContent = fs.readFileSync(filePath);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const extension = path.extname(filePath);
  const fileContentWithExt = Buffer.concat([Buffer.from(extension + '\0'), fileContent]);

  let encrypted = cipher.update(fileContentWithExt);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
};

const uploadFile = async (req, res) => {
  const file = req.file;
  const filePath = file.path;

  const key = crypto.randomBytes(16); // 128-bit key (16 bytes)
  const iv = crypto.randomBytes(16);  // Initialization vector for AES
  const encryptedContent = encryptFile(filePath, key, iv);

  const fileName = path.basename(filePath);
  const keyName = `${uuidv4()}-${fileName}.encrypted`;

  const uploadParams = {
    Bucket: 'cloudshare1',
    Key: keyName,
    Body: encryptedContent,
  };

  try {
    // Upload the file
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`File uploaded successfully`);

    // Generate a pre-signed URL for downloading the file
    const getObjectParams = {
      Bucket: 'cloudshare1',
      Key: keyName,
    };

    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
      expiresIn: 60 * 5, // URL expires in 5 minutes
    });

    const getPresignedUrlParams = (signedUrl) => {
      const urlObj = new URL(signedUrl);
      const params = urlObj.searchParams;

      const XAmzCredential = params.get('X-Amz-Credential');
      const XAmzDate = params.get('X-Amz-Date');
      const XAmzExpires = params.get('X-Amz-Expires');
      const XAmzSignature = params.get('X-Amz-Signature');

      return { XAmzCredential, XAmzDate, XAmzExpires, XAmzSignature };
    };

    const { XAmzCredential, XAmzDate, XAmzExpires, XAmzSignature } = getPresignedUrlParams(signedUrl);

    const url = `http://localhost:3001/download?keyName=${keyName}&XAmzCredential=${XAmzCredential}&XAmzDate=${XAmzDate}&XAmzExpires=${XAmzExpires}&XAmzSignature=${XAmzSignature}&key=${key.toString('hex')}&iv=${iv.toString('hex')}`;
    console.log(`The URL for downloading the encrypted file is ${url}`);

    res.status(200).send({
      message: 'File uploaded successfully!',
      downloadUrl: url
    });

  } catch (err) {
    console.error(`File upload failed. ${err.message}`);
    res.status(500).send({ error: err.message });
  }
};

module.exports = { uploadFile };
