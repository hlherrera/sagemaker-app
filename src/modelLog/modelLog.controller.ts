import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthModelGuard } from '../auth/authModel.guard';
import { ChameleonLogger } from '../logger/logger.service';
import { ChameleonModelInterceptor } from '../modelDeployment/chameleonModel.interceptor';
import { ModelLogService } from './modelLog.service';

@Controller('model')
@ApiTags('model-log')
export class ModelLogController {
  constructor(
    private logger: ChameleonLogger,
    private service: ModelLogService,
  ) {}

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The model logs',
  })
  @UseGuards(AuthGuard('jwt'), AuthModelGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ChameleonModelInterceptor)
  @Get('/:model/logs')
  async logs(
    @Body() body: any,
    @Param('model') modelId: string,
    @Query('limit') limit: number,
    @Query('order') order: 'desc' | 'asc',
  ) {
    //const { __model } = body;
    this.logger.debug(modelId);
    const result = await this.service.getLogs(modelId, limit, order);
    return result;
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The model responses',
  })
  @UseGuards(AuthGuard('jwt'), AuthModelGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ChameleonModelInterceptor)
  @Get('/:model/response')
  async results(
    @Param('model') modelId: string,
    @Query('limit') limit: number,
    @Query('order') order: 'desc' | 'asc',
  ) {
    this.logger.debug(modelId);
    const responses = await this.service.getResultLogs(modelId, limit, order);
    return responses;
  }
}
