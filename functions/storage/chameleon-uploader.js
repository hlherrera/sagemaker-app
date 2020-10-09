const s3Download = require('./s3download');
const s3Upload = require('./s3upload');

module.exports.handler = async function (props) {
  const {
    clientStorage: {
      accessKeyId,
      secretAccessKey,
      region,
      bucket: bucketClient,
      path,
    },
    chameleonStorage: { key },
  } = props;

  const bucketChameleon = process.env.BUCKET;
  try {
    const localPath = await s3Download(
      accessKeyId,
      secretAccessKey,
      region,
      bucketClient,
      path,
    );
    await s3Upload(
      bucketChameleon,
      String(localPath),
      key.replace(`s3://${bucketChameleon}/`, ''),
    );
  } catch (err) {
    console.error(err);
    props['error'] = err;
  }
  return props;
};
