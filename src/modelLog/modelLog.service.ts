import { Injectable } from '@nestjs/common';
import { connect as mongoDBConnect, disconnect } from 'mongoose';
import { DynamoService } from '../aws/dynamo/dynamo.service';

@Injectable()
export class ModelLogService {
  constructor(private readonly db: DynamoService) {}

  readonly DEFAULT_TABLE_NAME: string = 'Chameleon-Project-Table';
  async getLogs(
    modelId: string,
    limit: number = 100,
    order: string = 'desc',
  ): Promise<any> {
    const result = await this.db.query({
      TableName: `${process.env.CHAMELEON_APP_LOGS_TABLE}`,
      IndexName: 'model-logs-index',
      KeyConditionExpression: 'model = :modelId',
      ExpressionAttributeValues: {
        ':modelId': modelId, //: 'f0a49706-dc6a-48c9-b06a-f394add4d6cb',
      },
      Limit: limit,
    });
    if (result instanceof Array) {
      result.sort(($1, $2) => {
        const i = +(order !== 'asc');
        return (
          ($2.timestamp - $1.timestamp) * i +
          ($1.timestamp - $2.timestamp) * (1 - i)
        );
      });
      return result.map(({ app, model, ...rest }) => ({ ...rest }));
    }
    return result;
  }

  async getResultLogs(
    modelId: string,
    limit: number = 100,
    order: string = 'desc',
  ): Promise<any> {
    const protocol = process.env.MONGO_DB_PROTOCOL;
    const user = process.env.MONGO_DB_USER;
    const host = process.env.MONGO_DB_URL;
    const password = process.env.MONGO_DB_PASS;
    const db = process.env.MONGO_DB_NAME;
    const uri = `${protocol}://${user}:${password}@${host}/${db}?retryWrites=true&w=majority`;
    const conn = await mongoDBConnect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('> mongodb connected');

    const modelResponses = await conn.connection.db
      .collection('endpoint_logs')
      .find({ modelId })
      .limit(limit)
      .sort({ timestamp: order === 'desc' ? -1 : 1 })
      .toArray();

    const mapper = modelResponses
      .map(
        ({ requestId, appId, endpointInput, endpointOutput, timestamp }) => ({
          requestId,
          appId,
          modelId,
          endpointInput,
          endpointOutput,
          timestamp,
        }),
      )
      .map(async (r: { requestId: string }) => {
        const queryResult = await this.db
          .query({
            TableName: `${process.env.CHAMELEON_APP_LOGS_TABLE}`,
            KeyConditionExpression: 'model = :modelId and id = :requestId',
            ExpressionAttributeValues: {
              ':modelId': modelId,
              ':requestId': r.requestId,
            },
          })
          .catch(() => []);
        const logs = (queryResult as Array<any>).map(
          ({ text, duration, status }) => ({
            text,
            duration,
            status,
          }),
        );
        console.log('   --> --> Logs: ', JSON.stringify(logs));
        return { ...r, logs };
      });

    await disconnect();

    console.log('< mongodb disconnected');

    const responses = await Promise.all(mapper);

    console.log('Responses:');
    console.log(responses);

    return responses;
  }
}
