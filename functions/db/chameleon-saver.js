const { get, update } = require('./dynamo.db');

const findOne = async (appId) => {
  const params = {
    TableName: process.env.CHAMELEON_PROJECTS_TABLE,
    Key: {
      id: appId,
    },
  };
  return get(params);
};

const addModel = async (appId, model) => {
  try {
    const result = await findOne(appId);
    const models = [model, ...result.models];
    const params = {
      TableName: process.env.CHAMELEON_PROJECTS_TABLE,
      Key: {
        id: appId,
      },
      UpdateExpression: 'set updatedAt = :time, models=:models',
      ExpressionAttributeValues: {
        ':time': new Date().getTime(),
        ':models': models,
      },
      ReturnValues: 'ALL_NEW',
    };
    await update(params);
  } catch (err) {
    throw err;
  }
  return model.name;
};

module.exports.handler = async ({
  appClient,
  chameleonStorage: { key },
  clientModel: { modelName, type, mainProgram, prefix },
}) => {
  const [bucket] = key.replace('s3://', '').split('/');
  await addModel(appClient, {
    name: modelName,
    bucket,
    path: `${prefix}/`.replace('//', '/'),
    fn: mainProgram,
    type,
  });
  return {
    appClient,
    chameleonStorage: { key },
    deployed: 0,
    clientModel: { modelName, type, mainProgram, prefix },
  };
};
