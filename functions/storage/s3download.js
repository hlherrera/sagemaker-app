const fs = require('fs');
const { S3 } = require('aws-sdk');

module.exports = (accessKeyId, secretAccessKey, region, bucket, path) => {
  const fileName = path.replace(/\//gi, '');
  const tmpPath = `/tmp/${fileName}`;
  if (!fs.existsSync(tmpPath)) {
    const writeStream = fs.createWriteStream(tmpPath);
    const s3Client = new S3({
      accessKeyId,
      secretAccessKey,
      region,
    });
    return new Promise((resolve, reject) => {
      s3Client
        .getObject({
          Bucket: bucket,
          Key: path,
        })
        .createReadStream()
        .on('end', () => resolve(tmpPath))
        .on('error', (error) => {
          // tslint:disable-next-line: no-console
          console.error(error);
          fs.unlinkSync(tmpPath);
          reject(error);
        })
        .pipe(writeStream);
    });
  }
  return Promise.resolve(tmpPath);
};
