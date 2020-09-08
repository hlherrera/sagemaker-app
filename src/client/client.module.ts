import { Module } from '@nestjs/common';

import { ChameleonProjectService } from './chameleonProject.service';
import { AwsModule } from '../aws/aws.module';
import { ChameleonProjectController } from './chameleonProject.controller';

@Module({
  imports: [AwsModule],
  controllers: [ChameleonProjectController],
  providers: [ChameleonProjectService],
  exports: [ChameleonProjectService],
})
export class ClientModule {}
