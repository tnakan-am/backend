export const jwtConstants = {
  get secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  },
  expiresIn: '30d',
};
