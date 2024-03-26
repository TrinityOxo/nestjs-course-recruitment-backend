import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();

    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException('token không hợp lệ hoặc không có token')
      );
    }

    const currentMethod = request.method;
    const currentEndpoint = request.url as string;

    const permissions = user?.permissions ?? [];

    // let isExist = permissions.find((permission) => {
    //   return (
    //     // currentEndpoint === permission.apiPath &&
    //     currentMethod === permission.method
    //   );
    // });

    // if (currentEndpoint.startsWith('/api/v1/auth')) isExist = true;

    // if (!isSkipPermission) {
    //   throw new ForbiddenException('Not allow');
    // }

    return user;
  }
}
