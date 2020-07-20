import { ChameleonModel } from './chameleonModel';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AwsChameleonModel extends ChameleonModel {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'AWS access key for AWS S3 access',
  })
  accessKeyId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'AWS secret key for AWS S3 access',
  })
  secretAccessKey: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'AWS region',
  })
  region: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'AWS bucket',
  })
  bucket: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'S3 prefix or path to S3 objects.',
  })
  key: string;

  constructor(requestBody: any) {
    super(requestBody);
    this.accessKeyId = requestBody.accessKeyId;
    this.secretAccessKey = requestBody.secretAccessKey;
    this.region = requestBody.region;
    this.bucket = requestBody.bucket;
    this.key = requestBody.key;
  }
}
