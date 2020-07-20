import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';

import { ModelController } from './model.controller';
import { LoggerModule } from '../logger/logger.module';
import { ClientModule } from '../client/client.module';
import { DeploymentsProvider } from './deployments.provider';
import { S3DeploymentService } from './services/s3Deployment.service';

@Module({
  imports: [LoggerModule, ClientModule, AuthModule, AwsModule],
  controllers: [ModelController],
  providers: [DeploymentsProvider, S3DeploymentService],
})
export class ModelModule {}
