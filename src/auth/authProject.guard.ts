import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthProjectGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const isOk = request.user.appId === request.params.appId;
    if (!isOk) {
      throw new ForbiddenException();
    }
    return true;
  }
}
