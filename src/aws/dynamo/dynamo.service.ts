import { Injectable, Inject, HttpStatus, HttpException } from '@nestjs/common';

@Injectable()
export class DynamoService {
  constructor(@Inject('DynamoDB') private readonly dynamo: any) {}

  async get(params: {
    TableName: string;
    Key: object;
  }): Promise<object | Error> {
    return new Promise((resolve, reject) => {
      this.dynamo.get(params, (error: any, result: any) => {
        if (error) {
          reject(error);
        } else {
          if (result.Item) {
            resolve({ ...result.Item });
          } else {
            reject(
              new HttpException(
                'Not found registered resource',
                HttpStatus.NOT_FOUND,
              ),
            );
          }
        }
      });
    });
  }

  async register(params: {
    TableName: string;
    Item: object;
  }): Promise<object | Error> {
    return new Promise((resolve, reject) => {
      this.dynamo.put(params, (error: any, _: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(params.Item);
        }
      });
    });
  }

  async update(params: {
    TableName: string;
    Key: object;
    UpdateExpression: string;
    ExpressionAttributeValues: object;
  }): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      this.dynamo.update(params, (error: any, _: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }
}
