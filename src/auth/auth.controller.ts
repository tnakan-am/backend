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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EmailService } from '../email/email.service';
import { Public } from './public.decorator';
import {
  SignInDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendVerificationDto,
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
    const user = await this.usersService.create(dto);

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.verificationToken!,
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
