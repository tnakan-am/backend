import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts() {
    return this.productsService.getProducts();
  }

  @Post()
  async createProduct(@Body() createProductDto: ProductDto) {
    try {
      return await this.productsService.createProduct(createProductDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
