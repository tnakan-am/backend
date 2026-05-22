import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Public } from '../auth/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get()
  list(@Query('productId') productId: string) {
    return this.service.findByProduct(productId);
  }

  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.sub, dto);
  }
}
