import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../auth/public.decorator';

@Controller()
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public()
  @Get('categories')
  list() {
    return this.service.findCategories();
  }

  @Public()
  @Get('categories/tree')
  tree() {
    return this.service.getTree();
  }

  @Public()
  @Get('categories/:id')
  byId(@Param('id') id: string) {
    return this.service.findCategoryById(id);
  }

  @Public()
  @Get('sub-categories')
  subs(@Query('categoryId') categoryId?: string) {
    return this.service.findSubCategories(categoryId);
  }

  @Public()
  @Get('product-categories')
  productCategories(@Query('subCategoryId') subCategoryId?: string) {
    return this.service.findProductCategories(subCategoryId);
  }
}
