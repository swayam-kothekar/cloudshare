// const crypto = require('crypto');
// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');

// const algorithm = 'aes-256-cbc'; // Using CBC mode for better security

// const downloadFile = async (url, outputPath) => {
//   const response = await axios({
//     url,
//     method: 'GET',
//     responseType: 'arraybuffer'
//   });
//   fs.writeFileSync(outputPath, response.data);
// };

// const decryptFile = (encryptedPath, decryptedPath, key, iv) => {
//   const encryptedContent = fs.readFileSync(encryptedPath);
//   const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
//   let decrypted = decipher.update(encryptedContent);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);

//   // Extract the original file extension
//   const nullIndex = decrypted.indexOf('\0');
//   const extension = decrypted.slice(0, nullIndex).toString();
//   const originalContent = decrypted.slice(nullIndex + 1);

//   const finalDecryptedPath = path.join(path.dirname(decryptedPath), path.basename(decryptedPath, '.encrypted') + extension);
//   fs.writeFileSync(finalDecryptedPath, originalContent);
// };

// // Example usage
// const url = 'https://cloudshare1.s3.amazonaws.com/56f39e84-88c0-4411-b2f2-83d308274fd5-OUTPUT.encrypted?AWSAccessKeyId=AKIAQ3EGVXJPRAK2HNRF&Expires=1722972630&Signature=m1EtayI5ivXN46TUOvBzTKMKBLo%3D';  // Replace with the actual pre-signed URL
// const encryptedPath = 'sample.encrypted';
// const decryptedPath = 'sample.encrypted';
// const key = '8802ba477af7b67f71bee3531d096a6d43878b4f56ce030fa52b85663f119669';  // Replace with the actual encryption key
// const iv = '90d216e701423390af92533c6534325f';  // Replace with the actual initialization vector

// (async () => {
//   await downloadFile(url, encryptedPath);
//   decryptFile(encryptedPath, decryptedPath, key, iv);
//   console.log('File decrypted successfully');
// })();


const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const algorithm = 'aes-128-cbc';

const downloadFile = async (req, res) => {
  const { keyName, XAmzCredential, XAmzDate, XAmzExpires, XAmzSignature, key, iv } = req.query;

  if (!keyName || !XAmzCredential || !XAmzDate || !XAmzExpires || !XAmzSignature || !key || !iv) {
    res.status(400).send('Missing required query parameters: fileName, AWSAccessKeyId, Expires, Signature, key, iv');
    return;
  }

  try {
    const url = `https://cloudshare1.s3.us-east-1.amazonaws.com/${keyName}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=${XAmzCredential}&X-Amz-Date=${XAmzDate}&X-Amz-Expires=${XAmzExpires}&X-Amz-Signature=${XAmzSignature}&X-Amz-SignedHeaders=host&x-id=GetObject`
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const encryptedContent = response.data;
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedContent);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const nullIndex = decrypted.indexOf('\0');
    const extension = decrypted.slice(0, nullIndex).toString();
    const originalContent = decrypted.slice(nullIndex + 1);
    res.setHeader('Content-Disposition', `attachment; filename="${keyName.substring(keyName.indexOf('-') + 1).split('.')[0] + extension}"`);
    res.send(originalContent);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = { downloadFile };
