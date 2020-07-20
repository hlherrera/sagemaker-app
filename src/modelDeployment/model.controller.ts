import {
  Controller,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  HttpCode,
  UseInterceptors,
  Inject,
  HttpException,
  Body,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { S3Guard, TypeGuard } from '../aws/s3/s3.guard';

import { AuthModelGuard } from '../auth/authModel.guard';
import { ChameleonLogger } from '../logger/logger.service';

import {
  AwsChameleonModel,
  ChameleonProject,
  ChameleonModel,
} from '../client/domain';

import { DataProject } from './dataProject.decorator';
import { StorageType, DataModel, STORAGE_TYPE } from './storages';

import { ChameleonModelInterceptor } from './chameleonModel.interceptor';

import { DeploymentService } from './services/deployment.service';
import { SageMakerService } from '../aws/sagemaker/sagemaker.service';

const enum RESOURCE_TYPE {
  ENDPOINT = 'ep',
  ENDPOINT_CONFIG = 'cfg',
}
@Controller('model')
@ApiTags('model')
export class ModelController {
  private getResourceName(
    project: ChameleonProject,
    model: ChameleonModel,
    resourceType: RESOURCE_TYPE,
  ): string {
    const projectPrefix = (project.id ?? '').slice(0, 8);
    const projectSufix = (project.id ?? '').slice(-12);
    const modelPrefix = (model.name ?? '').slice(0, 8);
    const modelSufix = (model.name ?? '').slice(-12);
    return `${projectPrefix}${projectSufix}-${model.type}-${modelPrefix}${modelSufix}-${resourceType}`;
  }

  constructor(
    private logger: ChameleonLogger,
    @Inject('DeploymentServices') private services: DeploymentService[],
    @Inject('SageMakerService') private sm: SageMakerService,
  ) {}

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Model Deployment',
  })
  @ApiConsumes('application/json')
  @UseGuards(AuthGuard('jwt'), S3Guard({ type: TypeGuard.s3_PATH }))
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ChameleonModelInterceptor)
  @Post('deployment')
  async deploy(
    @DataProject() project: ChameleonProject,
    @DataModel() model: AwsChameleonModel,
    @StorageType() storageType: STORAGE_TYPE,
  ) {
    const service = this.services[storageType];
    if (!service) {
      throw new HttpException('Invalid params', HttpStatus.BAD_REQUEST);
    }
    const result = await service.deployModel(model, project.id).catch((err) => {
      this.logger.error(err);
      throw err;
    });

    const { startDate, executionArn } = result;
    const [, modelId] = executionArn.match(/:([\w-]+)$/i);
    return { startDate, model: modelId };
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The model inference',
  })
  @UseGuards(AuthGuard('jwt'), AuthModelGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ChameleonModelInterceptor)
  @Post('inference/:model')
  async predict(@DataProject() project: ChameleonProject, @Body() body: any) {
    const model: ChameleonModel = body.__model;
    const endpointName = this.getResourceName(
      project,
      model,
      RESOURCE_TYPE.ENDPOINT,
    );

    const status = await this.sm
      .status(endpointName)
      .then((response) => response.status === 'Ready')
      .catch((err) => {
        throw err;
      });

    if (!status) {
      throw new HttpException('Model not found', HttpStatus.NOT_FOUND);
    }

    const { __model, ...rest } = body;
    const params = {
      params: { ...rest },
      bucket: model['bucket'],
      prefix: model['path'],
      model: model.name,
      main: model.fn,
      type: model.type,
    };
    const buffer = Buffer.from(JSON.stringify(params));
    const response = await this.sm
      .predict(endpointName, buffer, {
        ContentType: 'application/json',
      })
      .catch((err) => {
        this.logger.error(err);
        return { Body: Buffer.from('') };
      });

    return Buffer.from(response.Body).toString('utf8');
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The status classification for a bucket path',
  })
  @UseGuards(AuthGuard('jwt'), AuthModelGuard)
  @UseInterceptors(ChameleonModelInterceptor)
  @Get('deployment/:model')
  async modelStatus(@DataProject() project: ChameleonProject, @Req() req: any) {
    const model: ChameleonModel = req.body['__model'];
    const endpointName = this.getResourceName(
      project,
      model,
      RESOURCE_TYPE.ENDPOINT,
    );

    return this.sm.status(endpointName);
  }
}
