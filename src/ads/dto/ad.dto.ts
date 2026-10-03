import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Ownership and approval are server-controlled: userId comes from the JWT and
// approval flows only through PATCH /ads/:id/approve.
export class CreateAdDto {
  // Upload URLs are absolute http(s); localhost has no TLD.
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
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

  // An http(s) URL or a site path such as /seller/:id. Blocks javascript: and
  // protocol-relative //host links.
  @Matches(/^(https?:\/\/|\/(?!\/))/, {
    message: 'link must be an http(s) URL or a path starting with /',
  })
  @IsOptional()
  link?: string;
}

export class UpdateAdDto extends PartialType(CreateAdDto) {}
