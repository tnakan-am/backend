import { SetMetadata } from '@nestjs/common';
import { UserType } from '../users/dto/create-user.dto';

export const ROLES_KEY = 'type';
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);