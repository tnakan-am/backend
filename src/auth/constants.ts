export const jwtConstants = {
  get secret(): string {
    return process.env.JWT_SECRET || 'DO_NOT_USE_THIS_VALUE_IN_PRODUCTION';
  },
  expiresIn: '30d' as const,
};
