import { Module } from '@nestjs/common';
import { AwsModule } from './aws/aws.module';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';

import { ModelModule } from './modelDeployment/model.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [LoggerModule, AwsModule, ClientModule, AuthModule, ModelModule],
})
export class AppModule {}
