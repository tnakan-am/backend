import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: nodemailer.TransportOptions = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    } as nodemailer.TransportOptions;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      (config as any).auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const url = `${baseUrl}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify Your Email Address',
      heading: 'Email Verification',
      body: `Thank you for registering! Click the button below to verify your email address. This link will expire in 24 hours.`,
      ctaText: 'Verify Email Address',
      ctaUrl: url,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const url = `${baseUrl}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset Your Password',
      heading: 'Password Reset Request',
      body: `Someone requested a password reset for your account. If that was you, click the button below to set a new password. The link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      ctaText: 'Reset Password',
      ctaUrl: url,
    });
  }

  private async send(opts: {
    to: string;
    subject: string;
    heading: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
  }): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: opts.to,
      subject: opts.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${opts.heading}</h2>
          <p>${opts.body}</p>
          <a href="${opts.ctaUrl}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
            ${opts.ctaText}
          </a>
          <p>If the button doesn't work, copy and paste this link:</p>
          <p><a href="${opts.ctaUrl}">${opts.ctaUrl}</a></p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email "${opts.subject}" sent to ${opts.to}`);
      if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) this.logger.log(`Ethereal preview: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send "${opts.subject}" to ${opts.to}`, error);
      throw new Error('Failed to send email');
    }
  }
}
