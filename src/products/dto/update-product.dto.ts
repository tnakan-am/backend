import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ProductDto } from './product.dto';

// Server-controlled fields (ownership, approval, denormalised identity) are not
// client-settable on update; approval flows only through PATCH /products/:id/approve.
export class UpdateProductDto extends PartialType(
  OmitType(ProductDto, [
    'userId',
    'approved',
    'userDisplayName',
    'userPhoto',
  ] as const),
) {}
