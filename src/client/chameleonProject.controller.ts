import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  HttpStatus,
  HttpCode,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChameleonProjectService } from './chameleonProject.service';

import {
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChameleonProject } from './domain/chameleonProject';
import { AuthGuard } from '@nestjs/passport';
import { AuthProjectGuard } from '../auth/authProject.guard';

@Controller('app')
@ApiTags('app')
export class ChameleonProjectController {
  constructor(private readonly appService: ChameleonProjectService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Successfully Registered' })
  @ApiConsumes('application/json')
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() project: ChameleonProject) {
    const result = await this.appService
      .register(project)
      .catch((error) => error);
    if (typeof result === 'object' && result.id) {
      return { appId: result.id };
    } else {
      const statusCode = result['statusCode'];
      const error = result.message;
      return { statusCode, error };
    }
  }

  @Delete(':appId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The app has been deleted successfully',
  })
  @UseGuards(AuthGuard('jwt'), AuthProjectGuard)
  async delete(@Param('appId') appId: string) {
    const result = await this.appService.deRegister(appId);
    console.log({ result });

    if (!(result && result instanceof Error)) {
      return { success: true };
    } else {
      const statusCode = result['statusCode'];
      const error = result?.message;
      return { statusCode, error };
    }
  }
}
