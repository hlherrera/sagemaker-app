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
  MODEL_STATUS,
} from '../client/domain';

import { DataProject } from './dataProject.decorator';
import { StorageType, DataModel, STORAGE_TYPE } from './storages';

import { ChameleonModelInterceptor } from './chameleonModel.interceptor';

import { DeploymentService } from './services/deployment.service';
import { SageMakerService } from '../aws/sagemaker/sagemaker.service';

@Controller('model')
@ApiTags('model')
export class ModelController {
  private getEndpointName(
    project: ChameleonProject,
    model: ChameleonModel,
  ): string {
    const projectPrefix = (project.id ?? '').slice(0, 8);
    const projectSufix = (project.id ?? '').slice(-12);
    const modelPrefix = (model.name ?? '').slice(0, 8);
    const modelSufix = (model.name ?? '').slice(-12);
    return `${projectPrefix}${projectSufix}-${model.type}-${modelPrefix}${modelSufix}`;
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
    const endpointName = this.getEndpointName(project, model);

    if (model.status !== MODEL_STATUS.IN_SERVICE) {
      throw new HttpException(
        'Model service is not Ready',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const { __model, ...rest } = body;
    const params = {
      params: { ...rest },
      bucket: model['bucket'],
      prefix: model['path'],
      model: model.name,
      main: model.fn,
      status: model.status,
      type: model.type,
    };
    const buffer = Buffer.from(JSON.stringify(params));
    const response = await this.sm
      .predict(endpointName, buffer, {
        ContentType: 'application/json',
      })
      .catch((err) => {
        this.logger.error(err);
        return { Body: Buffer.from('{"error": true}') };
      });

    return Buffer.from(response.Body).toString('utf8');
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The status classification for a bucket path',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  async getModels(@DataProject() project: ChameleonProject) {
    return project.models?.map((m) => ({
      fn: m.fn,
      id: m.name,
      displayName: m.displayName,
      status: m.status,
      statusMessage: m.statusMessage,
      type: m.type,
    }));
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The status classification for a bucket path',
  })
  @UseGuards(AuthGuard('jwt'), AuthModelGuard)
  @UseInterceptors(ChameleonModelInterceptor)
  @Get('/:model')
  async getModel(@Req() req: any) {
    const model: ChameleonModel = req.body['__model'];
    return {
      fn: model.fn,
      id: model.name,
      displayName: model.displayName,
      status: model.status,
      statusMessage: model.statusMessage,
      type: model.type,
    };
  }
}
