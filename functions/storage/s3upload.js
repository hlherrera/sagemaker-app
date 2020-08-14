const fs = require('fs');
const zlib = require('zlib');
const { S3 } = require('aws-sdk');

module.exports = (bucket, filePath, s3Key) => {
  const s3Client = new S3();
  var buffer = fs.createReadStream(filePath).pipe(zlib.createGzip());
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: buffer,
  };

  return new Promise((resolve, reject) => {
    s3Client.upload(params, (err, resp) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(resp);
    });
  });
};
