import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AwsModule } from '../aws/aws.module';
import { ClientModule } from '../client/client.module';
import { LoggerModule } from '../logger/logger.module';
import { ModelLogController } from './modelLog.controller';
import { ModelLogService } from './modelLog.service';

@Module({
  imports: [LoggerModule, ClientModule, AuthModule, AwsModule],
  controllers: [ModelLogController],
  providers: [ModelLogService],
  exports: [ModelLogService],
})
export class ModelLogModule {}
