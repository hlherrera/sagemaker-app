import {
  S3,
  DynamoDB,
  ECS,
  StepFunctions,
  SageMakerRuntime,
  SageMaker,
} from 'aws-sdk';

import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { EcsService } from './ecs/ecs.service';
import { DynamoService } from './dynamo/dynamo.service';
import { StepFunctionService } from './stepfunction/stepfunction.service';
import { SageMakerService } from './sagemaker/sagemaker.service';

const DynamoProvider = {
  provide: 'DynamoDB',
  useValue: new DynamoDB.DocumentClient(),
};

const S3Provider = {
  provide: 'S3',
  useValue: S3,
};

const EcsProvider = {
  provide: 'ECS',
  useValue: new ECS(),
};

const StepFunctionsProvider = {
  provide: 'StepFunctions',
  useValue: new StepFunctions(),
};

const SageMakerRuntimeProvider = {
  provide: 'SageMakerRuntime',
  useValue: new SageMakerRuntime(),
};

const SageMakerProvider = {
  provide: 'SageMaker',
  useValue: new SageMaker(),
};

@Global()
@Module({
  providers: [
    S3Service,
    S3Provider,
    EcsService,
    EcsProvider,
    DynamoService,
    DynamoProvider,
    StepFunctionService,
    StepFunctionsProvider,
    SageMakerService,
    SageMakerProvider,
    SageMakerRuntime,
    SageMakerRuntimeProvider,
  ],
  exports: [
    S3Service,
    S3Provider,
    EcsService,
    EcsProvider,
    DynamoService,
    DynamoProvider,
    StepFunctionService,
    StepFunctionsProvider,
    SageMakerService,
    SageMakerProvider,
    SageMakerRuntime,
    SageMakerRuntimeProvider,
  ],
})
export class AwsModule {}
