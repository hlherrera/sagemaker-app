import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { ChameleonModel } from './models/chameleonModel';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuid } from 'uuid';

export class ChameleonProject {
  @ApiHideProperty()
  @IsString()
  id?: string = uuid();

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  models?: ChameleonModel[] = [];

  build(params: {
    id?: string;
    name: string;
    description: string;
    models?: any;
  }) {
    this.id = params?.id ?? uuid();
    this.name = params?.name;
    this.description = params?.description;
    this.models = params.models;
    return this;
  }
}
