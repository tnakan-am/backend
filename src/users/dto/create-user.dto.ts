import { IsString, IsEmail, IsNotEmpty, MinLength, IsIn, Matches, IsEnum, IsOptional } from 'class-validator';

export enum UserType {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  type: UserType;
}
