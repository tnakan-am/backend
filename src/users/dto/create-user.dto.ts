import { IsString, IsEmail, IsNotEmpty, MinLength, IsIn, Matches } from 'class-validator';

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
  @IsIn(['buyer', 'seller', 'admin'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+374\d{8}$/)
  phone: string;
}
