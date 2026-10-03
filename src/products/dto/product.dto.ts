import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DeliveryOption, Unit } from '../entities/product.entity';

// Form inputs post numbers as strings ("12.5"); coerce them, but leave blank
// strings alone so @IsNumber() rejects them instead of saving 0.
const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Unit)
  unit: Unit;

  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  minQuantity: number;

  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  subCategory: string;

  @IsString()
  @IsOptional()
  productCategory?: string;

  // Either the literal 'unlimited' or a numeric string ("12").
  @IsString()
  @IsNotEmpty()
  availability: string;

  @IsEnum(DeliveryOption)
  deliveryOption: DeliveryOption;

  // Optional admin override on create; defaults to false otherwise.
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  // When omitted on POST, the controller fills these from the JWT.
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  userDisplayName?: string;

  @IsString()
  @IsOptional()
  userPhoto?: string | null;
}
