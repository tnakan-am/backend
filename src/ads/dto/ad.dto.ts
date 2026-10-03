import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Ownership and approval are server-controlled: userId comes from the JWT and
// approval flows only through PATCH /ads/:id/approve.
export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  headline: string;

  @IsString()
  @IsOptional()
  subheadline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  cta?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

export class UpdateAdDto extends PartialType(CreateAdDto) {}
