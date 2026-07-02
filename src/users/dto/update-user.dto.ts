import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserType } from '../entities/user.entity';

// Self-service update (PATCH /users/me): users may not change their own account
// `type` or the `isTopSeller` badge (the latter is not on CreateUserDto at all).
export class UpdateSelfDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email', 'type'] as const),
) {}

// Admin update (PATCH /users/:id): admins may additionally set the account type
// (any UserType, including admin) and the top-seller badge.
export class AdminUpdateUserDto extends UpdateSelfDto {
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsBoolean()
  isTopSeller?: boolean;
}
