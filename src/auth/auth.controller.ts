import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  GoneException,
} from '@nestjs/common';
import { ChameleonProjectService } from '../client/chameleonProject.service';
import { AuthService } from './auth.service';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginProjectInput } from './inputs/loginProject.input';

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
      if (!result.disabled) {
        return this.authService.sign(result ? result.id : '');
      } else {
        throw new GoneException();
      }
    } else {
      const statusCode = result['statusCode'];
      const error = result.message;
      return { statusCode, error };
    }
  }
}
