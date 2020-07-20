import { Module } from '@nestjs/common';

import { ChameleonProjectService } from './chameleonProject.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  providers: [ChameleonProjectService],
  exports: [ChameleonProjectService],
})
export class ClientModule {}
