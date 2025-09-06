import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getProducts() {
    return await this.productRepository.find({
        relations: {
            category: true,
            subCategory: true,
            productCategory: true,
        },
    });
  }

  async createProduct(createProductDto: ProductDto) {
    return await this.productRepository.save(createProductDto);
  }
}
