import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

describe('EmailService.sendVerificationEmail', () => {
  let sendMail: jest.Mock;
  let service: EmailService;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({});
    jest
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue({ sendMail } as never);
    service = new EmailService();
  });

  afterEach(() => jest.restoreAllMocks());

  it('thanks a new user for registering', async () => {
    await service.sendVerificationEmail('a@b.com', 't', 'register');
    expect(sendMail.mock.calls[0][0].html).toContain(
      'Thank you for registering!',
    );
  });

  it('uses neutral wording for a resend', async () => {
    await service.sendVerificationEmail('a@b.com', 't', 'resend');
    expect(sendMail.mock.calls[0][0].html).not.toContain('registering');
  });

  it('describes an email change', async () => {
    await service.sendVerificationEmail('a@b.com', 't', 'emailChange');
    const mail = sendMail.mock.calls[0][0];
    expect(mail.subject).toBe('Verify Your New Email Address');
    expect(mail.html).toContain('verify-email?token=t');
  });
});
