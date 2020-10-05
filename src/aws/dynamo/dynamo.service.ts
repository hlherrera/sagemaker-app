import { Injectable, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';

@Injectable()
export class DynamoService {
  constructor(
    @Inject('DynamoDB') private readonly dynamo: DynamoDB.DocumentClient,
  ) {}

  private _cb = (resolve: any, reject: any) => (error: any, result: any) => {
    if (error) {
      reject(error);
    } else {
      if (result.Item || result.Items) {
        result.Item ? resolve({ ...result.Item }) : resolve(result.Items);
      } else {
        reject(
          new HttpException(
            'Not found registered resource',
            HttpStatus.NOT_FOUND,
          ),
        );
      }
    }
  };
  async get(params: {
    TableName: string;
    Key: object;
  }): Promise<object | Error> {
    return new Promise((resolve, reject) => {
      this.dynamo.get(params, this._cb(resolve, reject));
    });
  }

  async query(params: {
    TableName: string;
    IndexName?: string;
    KeyConditionExpression?: string;
    ExpressionAttributeValues?: { [key: string]: any };
    Limit?: number;
  }): Promise<Array<any> | Error> {
    return new Promise((resolve, reject) => {
      this.dynamo.query(params, this._cb(resolve, reject));
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
