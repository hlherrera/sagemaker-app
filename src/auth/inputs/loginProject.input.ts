import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginProjectInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appId: string;
}
