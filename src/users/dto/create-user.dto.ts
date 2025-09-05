import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { CreateAddressDto } from '../../addresses/dto/create-address.dto';

export enum UserType {
  CUSTOMER = 'customer',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  hvhh?: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('AM')
  phone: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  type: UserType;

  @IsOptional()
  address?: CreateAddressDto;
}
