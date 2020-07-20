import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AwsChameleonModel } from '../../client/domain/models';

import { DeploymentService } from './deployment.service';

@Injectable()
export class S3DeploymentService implements DeploymentService {
  constructor(
    @Inject('StepFunctionService') private stateMachine: any,
    @Inject('SageMakerService') private sm: any,
  ) {}

  async deployModel(model: AwsChameleonModel, appId?: string): Promise<any> {
    const modelName = model.name ?? uuid();
    let response = {
      startDate: new Date(),
      executionArn: null,
    };
    const serverBucket = process.env.BUCKET_MODELS;
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
          type: model.type,
          prefix: `${appId}/${model.type}`,
          mainProgram: model.fn,
        },
        chameleonStorage: {
          key: s3Path,
          modelName,
        },
        appClient: appId,
        deployed: 0,
      }),
      name: modelName,
    });

    return response;
  }

  /* async status(idDeploy: string): Promise<any> {
    const HEADER = 'arn:aws:states';
    const arnStateMachine = process.env.STATE_MACHINE_MODEL_DEPLOY ?? '::';
    const [, region, accountId, , stateMachine] = arnStateMachine
      .replace(HEADER, '')
      .split(':');
    const executionArn = `${HEADER}:${region}:${accountId}:execution:${stateMachine}:${idDeploy}`;
    const response = await this.stateMachine.status({ executionArn });

    return response;
  }*/

  async status(endpointName: string) {
    return this.sm.status(endpointName);
  }
}
