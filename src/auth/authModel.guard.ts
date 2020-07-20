import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChameleonModel } from '../client/domain';

@Injectable()
export class AuthModelGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const models: ChameleonModel[] = request.user.app.models;
    if (
      models.findIndex((model) => model.name === request.params.model) === -1
    ) {
      throw new NotFoundException();
    }
    return true;
  }
}
