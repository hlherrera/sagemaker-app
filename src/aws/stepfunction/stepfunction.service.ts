import { Injectable, Inject } from '@nestjs/common';
import { StepFunctions } from 'aws-sdk';

export enum STEP_FUNCTION_STATUS {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
  ABORTED = 'ABORTED',
}

@Injectable()
export class StepFunctionService {
  constructor(@Inject('StepFunctions') private stateMachine: StepFunctions) {}

  start(params: {
    stateMachineArn: string;
    input: string;
    name?: string;
  }): Promise<{ executionArn: string; startDate: Date } | Error> {
    return new Promise((resolve, reject) => {
      this.stateMachine.startExecution(
        params,
        (err: any, data: { executionArn: string; startDate: Date }) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  }

  status(
    params: StepFunctions.Types.DescribeExecutionInput,
  ): Promise<StepFunctions.DescribeExecutionOutput | Error> {
    return new Promise((resolve, reject) => {
      this.stateMachine.describeExecution(
        params,
        (err: any, data: StepFunctions.DescribeExecutionOutput) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  }
}
