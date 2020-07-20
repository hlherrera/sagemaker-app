import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { StorageTypeInterface, STORAGE_TYPE } from './types.enum';

import { S3StorageType } from './types/s3StorageType';

import { AwsChameleonModel, ChameleonModel } from '../../client/domain/models';

const storages = [new S3StorageType()];

export const DataModel = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ChameleonModel | null => {
    const request = ctx.switchToHttp().getRequest();
    const requestBody = request.body;

    const [type] = storages
      .filter((d) => d.filter(requestBody))
      .map((d: StorageTypeInterface) => d.value());

    switch (type) {
      case STORAGE_TYPE.AWS_S3:
        return new AwsChameleonModel(requestBody);
    }
    return null;
  },
);

export const StorageType = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): STORAGE_TYPE => {
    const request = ctx.switchToHttp().getRequest();
    const requestBody = request.body;

    const [type] = storages
      .filter((d) => d.filter(requestBody))
      .map((d: StorageTypeInterface) => d.value());

    return type;
  },
);
