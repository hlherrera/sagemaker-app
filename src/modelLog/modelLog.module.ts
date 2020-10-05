import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';

import { ModelLogController } from './modelLog.controller';
import { LoggerModule } from '../logger/logger.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [LoggerModule, ClientModule, AuthModule, AwsModule],
  controllers: [ModelLogController],
  providers: [],
})
export class ModelLogModule {}
