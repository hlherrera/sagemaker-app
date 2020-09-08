import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AwsChameleonModel, MODEL_STATUS } from '../../client/domain/models';

import { DeploymentService } from './deployment.service';
import { INSTANCE_TYPE } from './instanceTypes';

@Injectable()
export class S3DeploymentService implements DeploymentService {
  constructor(
    @Inject('StepFunctionService') private stateMachine: any,
    @Inject('SageMakerService') private sm: any,
  ) {}

  async deployModel(
    model: AwsChameleonModel,
    appId?: string,
    instanceType: INSTANCE_TYPE = INSTANCE_TYPE.XS,
    isVolatile: 0 | 1 = 1,
  ): Promise<any> {
    const modelName = model.name ?? uuid();
    let response = {
      startDate: new Date(),
      executionArn: null,
    };
    const serverBucket = process.env.BUCKET;
    const serverPrefix = `${appId}/${model.type}/${modelName}.tar.gz`;
    const s3Path = `s3:///${serverBucket}/${serverPrefix}`.replace('//', '/');

    response = await this.stateMachine.start({
      stateMachineArn: process.env.STATE_MACHINE_MODEL_DEPLOY,
      input: JSON.stringify({
        clientStorage: {
          accessKeyId: model.accessKeyId,
          secretAccessKey: model.secretAccessKey,
          region: model.region,
          bucket: model.bucket,
          path: model.key,
        },
        clientModel: {
          modelName,
          displayName: model.displayName,
          type: model.type,
          prefix: `${appId}/${model.type}`,
          mainProgram: model.fn,
          instanceType,
          status: MODEL_STATUS.PROVISSIONING,
        },
        chameleonStorage: {
          key: s3Path,
          modelName,
        },
        appClient: appId,
        isVolatile,
        deployed: 0,
      }),
      name: modelName,
    });

    return response;
  }

  async status(endpointName: string) {
    return this.sm.status(endpointName);
  }
}
