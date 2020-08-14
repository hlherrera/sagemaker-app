import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MODEL_STATUS {
  TO_DEPLOY = 'To Deploy',
  PROVISSIONING = 'Provissioning',
  CREATING = 'Creating',
  UPDATING = 'Updating',
  DELETING = 'Deleting',
  DELETED = 'Deleted',
  IN_SERVICE = 'Ready',
  FAILED = 'Failed',
}
export class ChameleonModel {
  @IsString()
  @ApiProperty({ description: 'Unique name of the model' })
  name?: string;

  @IsString()
  @ApiProperty({ description: 'Display name of the model' })
  displayName?: string;

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

  @IsEnum(MODEL_STATUS)
  @ApiPropertyOptional({ description: 'status of the model.' })
  status?: MODEL_STATUS;

  @IsString()
  @ApiPropertyOptional({ description: 'status message.' })
  statusMessage: string;

  constructor(requestBody: {
    displayName?: string;
    name: string;
    type: string;
    fn: string;
  }) {
    this.displayName = requestBody.displayName;
    this.name = requestBody.name;
    this.type = requestBody.type;
    this.fn = requestBody.fn;
    this.status = MODEL_STATUS.TO_DEPLOY;
  }
}
