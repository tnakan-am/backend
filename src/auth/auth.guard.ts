import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { jwtConstants } from './constants';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request.headers.authorization);

    if (isPublic) {
      // Public routes allow anonymous access, but if a valid token is present
      // we still attach the user so handlers can widen behaviour for the
      // owner/admin (e.g. showing their own unapproved products). An
      // absent/invalid token is simply treated as anonymous.
      if (token) {
        try {
          (request as any).user = await this.jwtService.verifyAsync<JwtPayload>(
            token,
            { secret: jwtConstants.secret },
          );
        } catch {
          /* ignore — treat as anonymous */
        }
      }
      return true;
    }

    if (!token) {
      this.logger.warn(`Unauthorized — no token: ${request.url}`);
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtConstants.secret,
      });
      (request as any).user = payload;
    } catch {
      this.logger.warn(`Unauthorized — invalid token: ${request.url}`);
      throw new UnauthorizedException();
    }
    return true;
  }
}

export function extractBearerToken(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) return undefined;
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' ? token : undefined;
}
