import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
@Injectable()
export class S3Service {
  constructor(@Inject('S3') private Storage: any) {}

  getInstance(accessKeyId?: string, secretAccessKey?: string, region?: string) {
    return accessKeyId === null
      ? new this.Storage()
      : new this.Storage({
          accessKeyId,
          secretAccessKey,
          region,
        });
  }

  download(
    bucket: string,
    key: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ): Promise<string | Buffer> {
    const tmpPath = `/tmp/${uuid()}`;
    const writeStream: fs.WriteStream = fs.createWriteStream(tmpPath);
    const s3 = this.getInstance(accessKeyId, secretAccessKey, region);

    return new Promise((resolve, reject) => {
      s3.getObject({
        Bucket: bucket,
        Key: key,
      })
        .createReadStream()
        .on('end', () => resolve(tmpPath))
        .on('error', (error: any) => {
          // tslint:disable-next-line: no-console
          console.error(error);
          reject(error);
        })
        .pipe(writeStream);
    });
  }

  existObject(
    bucket: string,
    path: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ) {
    const s3 = this.getInstance(accessKeyId, secretAccessKey, region);
    const params = {
      Bucket: bucket,
      Key: path,
    };

    return s3.headObject(params).promise();
  }

  upload(
    bucket: string,
    filePath: string,
    key: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ) {
    const s3 = this.getInstance(accessKeyId, secretAccessKey, region);
    const buffer = fs.readFileSync(filePath);
    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
    };

    return new Promise((resolve, reject) => {
      s3.putObject(params, (err: any, resp: any) => {
        if (err) {
          // tslint:disable-next-line: no-console
          console.error(err);
          reject(err);
        }
        resolve(resp);
      });
    });
  }

  delete(
    bucket: string,
    path: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ) {
    const params = {
      Bucket: bucket,
      Key: path,
    };
    const s3 = this.getInstance(accessKeyId, secretAccessKey, region);
    return new Promise((resolve, reject) => {
      s3.deleteObject(params, (err: any, data: S3.Types.DeleteObjectOutput) => {
        if (err) {
          // tslint:disable-next-line: no-console
          console.error(err, err.stack);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  existPath(
    bucket: string,
    path: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ) {
    const s3 = this.getInstance(accessKeyId, secretAccessKey, region);
    const params = {
      Bucket: bucket,
      Prefix: path,
      MaxKeys: 1,
    };

    return s3.listObjectsV2(params).promise();
  }
}
