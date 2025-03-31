import { IsString, IsEmail, IsNotEmpty, MinLength, IsIn, Matches, IsEnum } from 'class-validator';

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
  @IsEnum(UserType)
  type: UserType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+374\d{8}$/)
  phone: string;
}
