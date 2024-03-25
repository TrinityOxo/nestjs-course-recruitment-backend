import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorator/customize';
import { ignoreElements } from 'rxjs';

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
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException('token không hợp lệ hoặc không có token')
      );
    }

    console.log('may co chay vao day ko z');

    const currentMethod = request.method;
    const currentEndpoint = request.url;

    console.log(currentMethod);
    console.log(currentEndpoint);

    const permission = user?.permission ?? [];

    const isExist = permission.find((permission) => {
      currentMethod === permission.method &&
        currentEndpoint === permission.apiPath;
    });

    if (!isExist) {
      throw new ForbiddenException('Not allow');
    }

    return user;
  }
}
