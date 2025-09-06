import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { Product } from './entities/product.entity';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } })) 
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.getProducts(paginationDto);
  }

  @Get(':id')
  async getProductById(@Param('id') id: number) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@Body() createProductDto: ProductDto) {
    try {
      return await this.productsService.createProduct(createProductDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async updateProduct(@Param('id') id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(id, updateProductDto);
  }
}
