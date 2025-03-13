import { IsString, IsEmail, IsNotEmpty, MinLength, IsIn, IsInt } from 'class-validator';

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


  @IsNotEmpty()
  @IsInt()
  phone: string;
}
