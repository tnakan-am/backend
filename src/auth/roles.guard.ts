import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../users/dto/create-user.dto';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }
    
    // The user object from JWT has the type field
    // We need to get the actual user type from the database
    // For now, we'll assume the user type is stored in the JWT
    // You may need to fetch the user from database to get the actual type
    
    return requiredRoles.some((role) => user.type === role);
  }
}