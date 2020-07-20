import { Module } from '@nestjs/common';
import { ChameleonLogger } from './logger.service';

@Module({
  providers: [ChameleonLogger],
  exports: [ChameleonLogger],
})
export class LoggerModule {}
