import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;
  let mockLogger: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    service = new EmailService();
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.FRONTEND_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create transporter with default values', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 587,
        secure: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
    });

    it('should create transporter with environment variables', () => {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'user@gmail.com';
      process.env.SMTP_PASS = 'password123';

      const newService = new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        auth: {
          user: 'user@gmail.com',
          pass: 'password123',
        },
      });
    });

    it('should create transporter without auth when credentials are not provided', () => {
      process.env.SMTP_HOST = 'localhost';
      process.env.SMTP_PORT = '1025';
      // No SMTP_USER or SMTP_PASS set

      const newService = new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const token = 'verificationToken123';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: email,
        subject: 'Verify Your Email Address',
        html: expect.stringContaining(`http://localhost:3000/auth/verify-email?token=${token}`),
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Verification email sent successfully to: ${email}`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Message ID: test-id`,
      );
    });

    it('should use environment variables for from address and frontend URL', async () => {
      process.env.SMTP_FROM = 'support@mycompany.com';
      process.env.FRONTEND_URL = 'https://myapp.com';

      const email = 'test@example.com';
      const token = 'verificationToken123';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'support@mycompany.com',
        to: email,
        subject: 'Verify Your Email Address',
        html: expect.stringContaining(`https://myapp.com/verify-email?token=${token}`),
      });
    });

    it('should include verification link in email HTML', async () => {
      const email = 'test@example.com';
      const token = 'verificationToken123';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendVerificationEmail(email, token);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Email Verification');
      expect(callArgs.html).toContain('Verify Email Address');
      expect(callArgs.html).toContain(`http://localhost:3000/auth/verify-email?token=${token}`);
      expect(callArgs.html).toContain('This verification link will expire in 24 hours');
    });

    it('should throw error when email sending fails', async () => {
      const email = 'test@example.com';
      const token = 'verificationToken123';
      const error = new Error('SMTP connection failed');

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendVerificationEmail(email, token)).rejects.toThrow(
        'Failed to send verification email',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
    });

    it('should handle non-Error objects when logging errors', async () => {
      const email = 'test@example.com';
      const token = 'verificationToken123';
      const error = 'String error';

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendVerificationEmail(email, token)).rejects.toThrow(
        'Failed to send verification email',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email to ${email}`,
        error,
      );
    });

    it('should log preview URL when using Ethereal email', async () => {
      process.env.SMTP_HOST = 'smtp.ethereal.email';
      const email = 'test@example.com';
      const token = 'verificationToken123';
      const previewUrl = 'https://ethereal.email/message/test-id';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
      (nodemailer.getTestMessageUrl as jest.Mock) = jest.fn().mockReturnValue(previewUrl);

      await service.sendVerificationEmail(email, token);

      expect(mockLogger.log).toHaveBeenCalledWith(`Preview URL: ${previewUrl}`);
    });
  });
});