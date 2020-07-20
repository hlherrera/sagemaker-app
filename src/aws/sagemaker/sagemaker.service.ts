import { Inject, Injectable } from '@nestjs/common';
import { SageMakerRuntime, SageMaker } from 'aws-sdk';

const STATUS = {
  OutOfService: 'Model out of Service',
  Creating: 'Creating model',
  Updating: 'Updating model',
  SystemUpdating: 'Updating model',
  RollingBack: 'Rolling Back model',
  InService: 'Ready',
  Deleting: 'Deleting model',
  Failed: 'Failed',
};
@Injectable()
export class SageMakerService {
  constructor(
    @Inject('SageMakerRuntime') private smr: SageMakerRuntime,
    @Inject('SageMaker') private sm: SageMaker,
  ) {}

  async predict(
    endpointName: string,
    body: string | Buffer,
    headers: {
      ContentType?: string;
      Accept?: string;
    },
  ) {
    const params = {
      Body: body,
      EndpointName: endpointName /* required */,
      Accept: 'application/json',
      ContentType: 'text/csv',
      ...headers,
    };
    //!!model && (params['TargetModel'] = model);
    return this.smr.invokeEndpoint(params).promise();
  }

  async status(endpointName: string) {
    const {
      CreationTime,
      //Valid Values: OutOfService | Creating | Updating | SystemUpdating | RollingBack | InService | Deleting | Failed
      EndpointStatus,
      FailureReason,
    } = await this.sm
      .describeEndpoint({
        EndpointName: endpointName,
      })
      .promise()
      .catch((err) => {
        console.error(err);
        return {
          CreationTime: null,
          EndpointStatus: 'Failed',
          FailureReason: err,
        };
      });

    return {
      time: CreationTime,
      status: STATUS[EndpointStatus],
      error: FailureReason,
    };
  }
}
