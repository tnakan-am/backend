import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderProductStatusDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '../users/entities/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.orders.createForUser(user.sub, dto);
  }

  @Get('customer')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.orders.listForCustomer(user.sub);
  }

  @Get('business')
  listVendor(@CurrentUser() user: JwtPayload) {
    return this.orders.listForVendor(user.sub);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  listForAdmin(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orders.listForAdmin(startDate, endDate);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.orders.getByIdForUser(id, user);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orders.updateOrderStatus(id, user, dto.status);
  }

  @Patch(':id/products/:productId/status')
  updateOrderProductStatus(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateOrderProductStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orders.updateOrderProductStatus(
      id,
      productId,
      user.sub,
      dto.status,
    );
  }
}
