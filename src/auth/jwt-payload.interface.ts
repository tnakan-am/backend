import { UserType } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  type: UserType;
}
