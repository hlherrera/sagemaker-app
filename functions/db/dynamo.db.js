const { DynamoDB } = require('aws-sdk');

const db = new DynamoDB.DocumentClient();

const get = async ({ TableName, Key }) => {
  return new Promise((resolve, reject) => {
    db.get({ TableName, Key }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.Item) {
          resolve({ ...result.Item });
        } else {
          reject({
            message: 'Not found registered resource',
            statusCode: 404,
          });
        }
      }
    });
  });
};

const update = async ({
  TableName,
  Key,
  UpdateExpression,
  ExpressionAttributeValues,
}) => {
  return new Promise((resolve, reject) => {
    db.update(
      {
        TableName,
        Key,
        UpdateExpression,
        ExpressionAttributeValues,
      },
      (error, _) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      },
    );
  });
};

module.exports = { get, update };
