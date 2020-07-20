// tslint:disable: max-classes-per-file

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
class S3PathGuard implements CanActivate {
  constructor(private readonly service: S3Service) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { bucket, path, accessKeyId, secretAccessKey, region } = request.body;
    if (bucket && path) {
      return this.service
        .existPath(bucket, path, accessKeyId, secretAccessKey, region)
        .then((head: any) => {
          if (head.Contents.length === 0) {
            throw new NotFoundException('Bucket or path location invalid.');
          }
          return true;
        })
        .catch((err: any) => {
          throw new HttpException(err.message, err.statusCode || err.status);
        });
    }
    return true;
  }
}

@Injectable()
export class S3ObjectGuard implements CanActivate {
  constructor(private readonly service: S3Service) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const errMessage = 'Bucket or file location invalid.';
    const request = context.switchToHttp().getRequest();
    const { bucket, file, accessKeyId, secretAccessKey, region } = request.body;
    if (bucket && file) {
      return this.service
        .existObject(bucket, file, accessKeyId, secretAccessKey, region)
        .then((head: any) => {
          if (!head) {
            throw new NotFoundException(errMessage);
          }
          return true;
        })
        .catch((err: any) => {
          throw new HttpException(
            err.message || errMessage,
            err.statusCode || err.status,
          );
        });
    }
    return true;
  }
}

export enum TypeGuard {
  S3_OBJECT,
  s3_PATH,
}
export const S3Guard = ({ type }) => {
  if (type === TypeGuard.S3_OBJECT) {
    return S3ObjectGuard;
  }

  return S3PathGuard;
};
