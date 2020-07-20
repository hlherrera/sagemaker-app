import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DataProject = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const client = request.user.app;
    return client;
  },
);
