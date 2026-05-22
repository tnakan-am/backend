import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { OrderStatus } from '../orders/order-status.enum';
import { NotificationsGateway } from './notifications.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @Get('my')
  async my(@CurrentUser() user: JwtPayload) {
    return this.service.findForUser(user.sub);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    const existing = await this.service.findById(id);
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.userId !== user.sub) {
      throw new ForbiddenException('You cannot modify this notification');
    }
    const updated = await this.service.updateStatus(id, status);
    this.gateway.emitStatus(user.sub, {
      id: updated.id,
      orderId: updated.orderId,
      status: updated.status,
    });
    return updated;
  }
}
