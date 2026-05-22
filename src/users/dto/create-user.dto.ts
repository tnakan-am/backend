import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '../entities/user.entity';
import { AddressDto } from './address.dto';

export { UserType };

// Public self-registration may only create customer or business accounts.
// Admins are provisioned out-of-band, never through the @Public() register route.
export const SELF_REGISTRABLE_TYPES = [
  UserType.CUSTOMER,
  UserType.BUSINESS,
] as const;

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsIn(SELF_REGISTRABLE_TYPES as readonly UserType[])
  @IsNotEmpty()
  type: UserType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  surname?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  hvhh?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isTopSeller?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
