import { validate } from 'class-validator';
import { CreateUserDto, UserType } from './create-user.dto';

describe('CreateUserDto', () => {
  let dto: CreateUserDto;

  beforeEach(() => {
    dto = new CreateUserDto();
    dto.fullName = 'John Doe';
    dto.email = 'john@example.com';
    dto.password = 'password123';
    dto.phone = '+37491234567';
    dto.type = UserType.CUSTOMER;
  });

  describe('phone validation', () => {
    it('should accept valid Armenian phone numbers', async () => {
      const validPhones = [
        '+37491234567',  // International format with +374
        '+37493456789',
        '+37498765432',
        '+37477123456',
        '+37494567890',
        '+37499876543',
        '091234567',     // Local format (might be accepted)
        '093456789',
      ];

      for (const phone of validPhones) {
        dto.phone = phone;
        const errors = await validate(dto);
        const phoneErrors = errors.filter(e => e.property === 'phone');
        if (phoneErrors.length > 0) {
          console.log(`Phone "${phone}" should be valid but got errors:`, phoneErrors[0].constraints);
        }
        expect(phoneErrors).toHaveLength(0);
      }
    });

    it('should reject invalid phone numbers', async () => {
      const invalidPhones = [
        { phone: '1234567890', reason: 'Generic number' },
        { phone: '5555555555', reason: 'US format' },
        { phone: '+11234567890', reason: 'Wrong country code' },
        { phone: 'notaphone', reason: 'Not a number' },
        { phone: '', reason: 'Empty string' },
        { phone: '+374123', reason: 'Too short' },
        { phone: '+3749999999999999', reason: 'Too long' },
      ];

      for (const { phone, reason } of invalidPhones) {
        dto.phone = phone;
        const errors = await validate(dto);
        const phoneErrors = errors.filter(e => e.property === 'phone');
        if (phoneErrors.length === 0) {
          console.log(`Phone "${phone}" (${reason}) passed validation unexpectedly`);
        }
        expect(phoneErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject missing phone number', async () => {
      delete dto.phone;
      const errors = await validate(dto);
      const phoneErrors = errors.filter(e => e.property === 'phone');
      expect(phoneErrors.length).toBeGreaterThan(0);
      expect(phoneErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('email validation', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user@domain.co.uk',
        'john.doe@company.org',
      ];

      for (const email of validEmails) {
        dto.email = email;
        const errors = await validate(dto);
        const emailErrors = errors.filter(e => e.property === 'email');
        expect(emailErrors).toHaveLength(0);
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        '',
      ];

      for (const email of invalidEmails) {
        dto.email = email;
        const errors = await validate(dto);
        const emailErrors = errors.filter(e => e.property === 'email');
        expect(emailErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('password validation', () => {
    it('should accept passwords with at least 8 characters', async () => {
      dto.password = 'validpass';
      const errors = await validate(dto);
      const passwordErrors = errors.filter(e => e.property === 'password');
      expect(passwordErrors).toHaveLength(0);
    });

    it('should reject passwords shorter than 8 characters', async () => {
      dto.password = 'short';
      const errors = await validate(dto);
      const passwordErrors = errors.filter(e => e.property === 'password');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('type validation', () => {
    it('should accept valid user types', async () => {
      const validTypes = [UserType.CUSTOMER, UserType.BUSINESS, UserType.ADMIN];

      for (const type of validTypes) {
        dto.type = type;
        const errors = await validate(dto);
        const typeErrors = errors.filter(e => e.property === 'type');
        expect(typeErrors).toHaveLength(0);
      }
    });

    it('should reject invalid user types', async () => {
      dto.type = 'invalid' as any;
      const errors = await validate(dto);
      const typeErrors = errors.filter(e => e.property === 'type');
      expect(typeErrors.length).toBeGreaterThan(0);
      expect(typeErrors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('hvhh validation', () => {
    it('should accept hvhh as optional field', async () => {
      delete dto.hvhh;
      const errors = await validate(dto);
      const hvhhErrors = errors.filter(e => e.property === 'hvhh');
      expect(hvhhErrors).toHaveLength(0);
    });

    it('should accept valid hvhh value', async () => {
      dto.hvhh = '12345678';
      const errors = await validate(dto);
      const hvhhErrors = errors.filter(e => e.property === 'hvhh');
      expect(hvhhErrors).toHaveLength(0);
    });
  });

  describe('fullName validation', () => {
    it('should reject empty fullName', async () => {
      dto.fullName = '';
      const errors = await validate(dto);
      const nameErrors = errors.filter(e => e.property === 'fullName');
      expect(nameErrors.length).toBeGreaterThan(0);
      expect(nameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});