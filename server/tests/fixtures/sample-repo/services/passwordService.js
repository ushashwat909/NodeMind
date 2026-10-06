import bcrypt from 'bcrypt';

/**
 * Service for password hashing operations
 */
export class PasswordService {
  hashPasswordSync(plaintext) {
    // Performance flaw: synchronous hashing blocks the event loop
    return bcrypt.hashSync(plaintext, 10);
  }
}
