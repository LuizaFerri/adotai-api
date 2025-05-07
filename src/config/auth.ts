export default {
  jwt: {
    secret: process.env.JWT_SECRET || 'adotai-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
}; 