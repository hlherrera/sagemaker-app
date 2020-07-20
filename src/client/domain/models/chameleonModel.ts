import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChameleonModel {
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'type of model.',
  })
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'main program file.' })
  fn: string;

  constructor(requestBody: { name: string; type: string; fn: string }) {
    this.name = requestBody.name;
    this.type = requestBody.type;
    this.fn = requestBody.fn;
  }
}
