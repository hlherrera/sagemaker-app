const fs = require('fs');
const { S3 } = require('aws-sdk');

module.exports = (bucket, filePath, s3Key) => {
  const s3Client = new S3();
  const buffer = fs.readFileSync(filePath);
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: buffer,
  };

  return new Promise((resolve, reject) => {
    s3Client.putObject(params, (err, resp) => {
      if (err) {
        // tslint:disable-next-line: no-console
        console.error(err);
        reject(err);
      }
      resolve(resp);
    });
  });
};
