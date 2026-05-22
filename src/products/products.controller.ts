import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserType } from '../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  getProducts(@Query() dto: PaginationDto) {
    return this.productsService.getProducts(dto);
  }

  @Public()
  @Get('top')
  getTop(@Query('limit') limit?: string) {
    return this.productsService.getTopProducts(limit ? +limit : 10);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Post()
  create(@Body() dto: ProductDto, @CurrentUser() user: JwtPayload) {
    return this.productsService.create({
      ...dto,
      userId: dto.userId ?? user.sub,
      userDisplayName: dto.userDisplayName ?? user.displayName,
      userPhoto: dto.userPhoto ?? null,
    });
  }

  @Patch('batch')
  batchUpdate(
    @Query('userId') userId: string,
    @Body() patch: UpdateProductDto,
  ) {
    return this.productsService.batchUpdateByUserId(userId, patch as any);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  approve(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
  ) {
    return this.productsService.approve(id, approved !== false);
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body('availability') availability: string,
  ) {
    return this.productsService.setAvailability(id, availability);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
