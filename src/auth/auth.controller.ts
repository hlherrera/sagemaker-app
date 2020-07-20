import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ChameleonProjectService } from '../client/chameleonProject.service';
import { AuthService } from './auth.service';

import {
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { LoginProjectInput } from './inputs/loginProject.input';
import { ChameleonProject } from '../client/domain/chameleonProject';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appService: ChameleonProjectService,
  ) {}

  @Post('login/')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The app has been login successfully',
  })
  async login(@Body() req: LoginProjectInput) {
    const result = await this.appService.findOne(req.appId).catch((err) => err);
    if (result.id) {
      return this.authService.sign(result ? result.id : '');
    } else {
      const statusCode = result['statusCode'];
      const error = result.message;
      return { statusCode, error };
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Successfully Registered' })
  @ApiConsumes('application/json')
  @Post('register/')
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
}
