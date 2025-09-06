import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsObject } from 'class-validator';

export class ProductDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsNumber()
  @IsNotEmpty()
  subCategoryId: number;

  @IsNumber()
  @IsNotEmpty()
  productCategoryId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @IsOptional()
  viewCount?: number;

  @IsNumber()
  @IsOptional()
  salesCount?: number;
}
