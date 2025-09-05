import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

  constructor() {
    const config: any = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000, // 10 seconds
    };

    // Only add auth if credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendVerificationEmail(email: string, token: string) {
    // If FRONTEND_URL is set, use it (for production with separate frontend)
    // Otherwise, use the backend API endpoint directly
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000/auth';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering with us! Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to: ${email}`);
      this.logger.log(`Message ID: ${info.messageId}`);
      
      // If using Ethereal, log the preview URL
      if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`Preview URL: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error instanceof Error ? error.stack : error,
      );
      throw new Error('Failed to send verification email');
    }
  }
}