import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  HttpException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './sign-in.dto';
import { AddressService } from '../addresses/address.service';
import { EmailService } from '../email/email.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UserService,
    private readonly addressService: AddressService,
    private readonly emailService: EmailService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    try {
      return await this.authService.signIn(signInDto.email, signInDto.password);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error during authentication',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);

      if (createUserDto.address.city) {
        await this.addressService.create({
          userId: user.id,
          ...createUserDto.address,
        });
      }

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(
          user.email,
          user.verificationToken,
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, but log the error
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          type: user.type,
          verified: user.verified,
        },
        message:
          'Registration successful! Please check your email to verify your account.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error during registration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      if (!token) {
        throw new HttpException(
          'Verification token is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.usersService.verifyEmail(token);

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          verified: user.verified,
          verifiedAt: user.verifiedAt,
        },
        message: 'Email verified successfully!',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error during email verification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
