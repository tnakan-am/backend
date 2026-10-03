import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdDto, UpdateAdDto } from './dto/ad.dto';
import { ApproveProductDto } from '../products/dto/approve-product.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserType } from '../users/entities/user.entity';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Public()
  @Get()
  getApproved() {
    return this.adsService.getApproved();
  }

  @Get('mine')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.adsService.getByUser(user.sub);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  getAll(
    @Query('approved', new ParseBoolPipe({ optional: true }))
    approved?: boolean,
  ) {
    return this.adsService.getAll(approved);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.BUSINESS)
  create(@Body() dto: CreateAdDto, @CurrentUser() user: JwtPayload) {
    return this.adsService.create(dto, user.sub);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  approve(@Param('id') id: string, @Body() dto: ApproveProductDto) {
    return this.adsService.approve(id, dto.approved);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adsService.update(id, dto, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adsService.delete(id, user);
  }
}
