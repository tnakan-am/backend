import { OmitType } from '@nestjs/mapped-types';
import { ProductDto } from './product.dto';

// Ownership, approval and denormalised identity are filled server-side from the
// JWT; clients cannot set them on create.
export class CreateProductDto extends OmitType(ProductDto, [
  'userId',
  'approved',
  'userDisplayName',
  'userPhoto',
] as const) {}
