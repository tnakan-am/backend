import { IsBoolean } from 'class-validator';

export class ApproveProductDto {
  @IsBoolean()
  approved: boolean;
}
