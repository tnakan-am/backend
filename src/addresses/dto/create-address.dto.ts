import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  house: string;

  @IsString()
  @IsOptional()
  zip: string;
}
