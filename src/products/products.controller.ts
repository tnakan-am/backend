import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApproveProductDto } from './dto/approve-product.dto';
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
  async getById(@Param('id') id: string) {
    const product = await this.productsService.getById(id);
    // Public detail endpoint never exposes unapproved products.
    if (!product.approved) throw new NotFoundException('Product not found');
    return product;
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productsService.create({
      ...dto,
      userId: user.sub,
      userDisplayName: user.displayName,
      userPhoto: null,
    });
  }

  @Patch('batch')
  batchUpdate(
    @Body() patch: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.batchUpdateByUserId(user.sub, patch);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  approve(@Param('id') id: string, @Body() dto: ApproveProductDto) {
    return this.productsService.approve(id, dto.approved);
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body('availability') availability: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.setAvailability(id, availability, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
