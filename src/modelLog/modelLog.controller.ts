import {
  Controller,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  HttpCode,
  UseInterceptors,
  Body,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuthModelGuard } from '../auth/authModel.guard';
import { ChameleonLogger } from '../logger/logger.service';

import { ChameleonModelInterceptor } from '../modelDeployment/chameleonModel.interceptor';
import { DynamoService } from '../aws/dynamo/dynamo.service';

@Controller('model')
@ApiTags('model-log')
export class ModelLogController {
  constructor(private logger: ChameleonLogger, private db: DynamoService) {}

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The model inference',
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
    const result = await this.db.query({
      TableName: `${process.env.CHAMELEON_APP_LOGS_TABLE}`,
      IndexName: 'model-logs-index',
      KeyConditionExpression: 'model = :modelId',
      ExpressionAttributeValues: {
        ':modelId': modelId, //: 'a8ba72c7-b363-4169-9d65-863e4227a913',
      },
      Limit: limit || 100,
    });
    if (result instanceof Array) {
      result.sort(($1, $2) => {
        const i = +(order !== 'asc');
        return (
          ($2.timestamp - $1.timestamp) * i +
          ($1.timestamp - $2.timestamp) * (1 - i)
        );
      });
      return result.map(({ app, model, ...rest }) => ({ ...rest }));
    }
    return result;
  }
}
