import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  sortBy?: string = 'salesCount';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  subCategoryId?: number;

  @IsOptional()
  @Type(() => Number)
  productCategoryId?: number;

  @IsOptional()
  isActive?: boolean = true;

  @IsOptional()
  isFeatured?: boolean;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}