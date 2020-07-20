import { Test, TestingModule } from '@nestjs/testing';
import {
  StepFunctionService,
  STEP_FUNCTION_STATUS,
} from './stepfunction.service';

import { HttpStatus } from '@nestjs/common';
import { StepFunctions } from 'aws-sdk';

describe('StepFunctionService', () => {
  let service: StepFunctionService;
  const mockStatusFn = jest.fn();
  beforeEach(async () => {
    const StepFunction = {
      startExecution: (
        params: StepFunctions.StartExecutionInput,
        cb: (err: any, data: StepFunctions.StartExecutionOutput) => void,
      ) => {
        const name = JSON.parse(params.input || '{name:null}').name;
        !!params
          ? cb(null, {
              executionArn: `arn:aws:states:region:account-id:execution:${name}`,
              startDate: new Date(),
            })
          : cb(true, { executionArn: '', startDate: new Date() });
      },
      describeExecution: (
        params: { executionArn: string },
        cb: (
          err: any,
          data: {
            executionArn?: string;
            name: string;
            status: STEP_FUNCTION_STATUS;
            startDate?: Date;
            stopDate?: Date;
            input?: string;
            output?: string;
          },
        ) => void,
      ) => {
        if (params && params.executionArn.length > 0) {
          mockStatusFn();
          cb(null, {
            output: JSON.stringify({ success: true }),
            status: STEP_FUNCTION_STATUS.SUCCEEDED,
            name: params.executionArn.split(':').pop() || '',
          });
        } else {
          cb(
            { statusCode: HttpStatus.NOT_FOUND },
            {
              name: '',
              status: STEP_FUNCTION_STATUS.FAILED,
            },
          );
        }
      },
    };
    const Provider = {
      provide: 'StepFunctions',
      useValue: StepFunction,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [StepFunctionService, Provider],
    }).compile();

    service = module.get<StepFunctionService>(StepFunctionService);
    mockStatusFn.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should run executions', async () => {
    const bucket = 'myBucket';
    const model = 'model';
    const appId = 'app-id';
    const provider = 'aws';
    const path = '/path/to/store/generated/model';

    const response = await service.start({
      stateMachineArn:
        'arn:aws:states:region:accountid:stateMachine:sts-classification',
      input: JSON.stringify({
        provider,
        appId,
        model,
        bucket,
        path,
        name: 'test-execution',
      }),
    });
    if (!(response instanceof Error)) {
      expect(response.executionArn).toBe(
        'arn:aws:states:region:account-id:execution:test-execution',
      );
    }
  });

  it('should check Status of the Job', async () => {
    await service.status({ executionArn: 'arn' });
    expect(mockStatusFn).toHaveBeenCalled();
  });

  it('should reject status of the Job', async () => {
    const error = await service
      .status({ executionArn: '' })
      .catch((err) => err);
    expect(error).toHaveProperty('statusCode');
    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(mockStatusFn).not.toHaveBeenCalled();
  });
});
