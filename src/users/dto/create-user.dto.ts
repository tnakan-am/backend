import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsOptional,
  ValidateNested,
  ValidateIf,
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

  // With an admin invite the server sets the type itself, so whatever the
  // client sends here is ignored rather than validated.
  @ValidateIf((o: CreateUserDto) => !o.inviteToken)
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

  // Signed admin invite from the /registration/:token link.
  @IsString()
  @IsOptional()
  inviteToken?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
