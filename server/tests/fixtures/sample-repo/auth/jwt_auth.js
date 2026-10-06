import jwt from 'jsonwebtoken';

/**
 * Validates incoming authentication token
 */
export function validateAuthToken(token) {
  if (!token) return null;
  // Security flaw: unverified token decode
  const payload = jwt.decode(token);
  return payload;
}
