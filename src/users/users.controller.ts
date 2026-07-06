import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './users.service';
import { AdminUpdateUserDto, UpdateSelfDto } from './dto/update-user.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserType } from './entities/user.entity';
import { ChangeEmailDto, ChangePasswordDto } from '../auth/sign-in.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    const found = await this.userService.findById(user.sub);
    return this.userService.toSafeUser(found);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateSelfDto) {
    return this.userService.update(user.sub, dto);
  }

  @Post('me/password')
  async changeMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }

  @Post('me/email')
  async changeMyEmail(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.userService.changeEmail(
      user.sub,
      dto.currentPassword,
      dto.newEmail,
    );
  }

  @Get('businesses')
  async listBusinesses() {
    return this.userService.findBusinesses();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async findAll() {
    return this.userService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() requester?: JwtPayload,
  ) {
    const user = await this.userService.findById(id);
    // Business profiles are public storefronts, visible to anyone including
    // anonymous visitors; customers' profiles are private to themselves and
    // admins.
    const isSelf = requester?.sub === id;
    const isAdmin = requester?.type === UserType.ADMIN;
    if (!isSelf && !isAdmin && user.type !== UserType.BUSINESS) {
      throw new ForbiddenException('You cannot access this user');
    }
    return this.userService.toSafeUser(user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { success: true };
  }
}
