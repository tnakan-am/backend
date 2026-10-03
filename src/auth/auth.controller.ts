import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  HttpException,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EmailService } from '../email/email.service';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';
import { UserType } from '../users/entities/user.entity';
import {
  SignInDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendVerificationDto,
  AdminInviteDto,
} from './sign-in.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.email, dto.password);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const { inviteToken, ...data } = dto;
    if (inviteToken) {
      await this.authService.redeemAdminInvite(inviteToken, data.email);
      // The invite link reached this mailbox, so it is already verified.
      const admin = await this.usersService.create(data, {
        type: UserType.ADMIN,
        verified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      });
      return {
        success: true,
        data: this.usersService.toSafeUser(admin),
        message: 'Admin account created. You can now log in.',
      };
    }

    const user = await this.usersService.create(data);

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.verificationToken!,
        'register',
      );
    } catch (err) {
      this.logger.warn(`Verification email send failed for ${user.email}`, err);
    }

    return {
      success: true,
      data: this.usersService.toSafeUser(user),
      message:
        'Registration successful! Please check your email to verify your account.',
    };
  }

  @Post('admin-invites')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async inviteAdmin(
    @Body() dto: AdminInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const token = await this.authService.createAdminInvite(dto.email, user.sub);
    await this.emailService.sendAdminInviteEmail(dto.email, token);
    return { success: true };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new HttpException('Token required', HttpStatus.BAD_REQUEST);
    }
    const user = await this.usersService.verifyEmail(token);
    return {
      success: true,
      data: this.usersService.toSafeUser(user),
      message: 'Email verified successfully!',
    };
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    const user = await this.usersService.issueVerificationToken(dto.email);
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.verificationToken!,
        'resend',
      );
    } catch (err) {
      this.logger.warn(`Verification resend failed for ${user.email}`, err);
    }
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.usersService.issuePasswordResetToken(dto.email);
    if (user) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.passwordResetToken!,
        );
      } catch (err) {
        this.logger.warn(`Reset email failed for ${user.email}`, err);
      }
    }
    return {
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.usersService.resetPassword(dto.token, dto.password);
    return { success: true };
  }
}
