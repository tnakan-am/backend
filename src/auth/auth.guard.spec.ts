import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let mockLogger: any;

  beforeEach(() => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    jwtService = mockJwtService as any;
    guard = new AuthGuard(jwtService);
    (guard as any).logger = mockLogger;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        url: '/api/test',
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };
    });

    it('should allow access with valid token', async () => {
      const token = 'valid-jwt-token';
      const payload = {
        sub: 1,
        email: 'user@example.com',
        full_name: 'John Doe',
      };

      mockRequest.headers.authorization = `Bearer ${token}`;
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: undefined,
      });
      expect(mockRequest.user).toEqual(payload);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unauthorized access attempt - no token provided: /api/test',
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const token = 'invalid-jwt-token';
      mockRequest.headers.authorization = `Bearer ${token}`;
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unauthorized access attempt - invalid token: /api/test',
      );
    });

    it('should throw UnauthorizedException for malformed authorization header', async () => {
      mockRequest.headers.authorization = 'InvalidHeader';

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle token without Bearer prefix', async () => {
      mockRequest.headers.authorization = 'jwt-token-without-bearer';

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should extract token from bearer authorization correctly', async () => {
      const token = 'valid-jwt-token';
      const payload = {
        sub: 1,
        email: 'user@example.com',
        full_name: 'John Doe',
      };

      mockRequest.headers.authorization = `Bearer ${token}`;
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

      await guard.canActivate(mockContext);

      expect(guard['extractTokenFromHeader'](mockRequest)).toBe(token);
    });

    it('should return undefined for missing authorization header', () => {
      expect(guard['extractTokenFromHeader'](mockRequest)).toBeUndefined();
    });

    it('should return undefined for non-Bearer authorization', () => {
      mockRequest.headers.authorization = 'Basic sometoken';
      expect(guard['extractTokenFromHeader'](mockRequest)).toBeUndefined();
    });

    it('should handle JWT verification errors properly', async () => {
      const token = 'expired-jwt-token';
      mockRequest.headers.authorization = `Bearer ${token}`;
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: undefined,
      });
    });

    it('should log warning for unauthorized access attempts', async () => {
      mockRequest.headers.authorization = '';

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});