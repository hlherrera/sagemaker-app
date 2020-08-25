import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChameleonModel } from '../client/domain/models';

@Injectable()
export class ChameleonModelInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    res.setHeader('Content-Type', 'application/json');

    const models: ChameleonModel[] = request.user?.app?.models ?? [];
    const modelName = request.params['model'] || request.body.modeName;
    const body = request.body || {};
    const [__model] = models.filter((m) => m.name === modelName);

    request.body = {
      ...body,
      ...{
        __model,
      },
    };

    return next.handle();
  }
}
